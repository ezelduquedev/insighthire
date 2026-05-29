import { groqClient, MODEL } from './openai'; // Esto ya funcionará perfecto
import { prisma } from './prisma';

interface AnalysisResult {
  summary: string;
  seniority: 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD';
  strengths: string[];
  weaknesses: string[];
  technicalScore: number;
  generalScore: number;
  justification: string;
}

export async function analyzeCandidate(candidateId: string): Promise<AnalysisResult> {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      resume: true,
      experiences: true,
      education: true,
      skills: true,
    },
  });

  if (!candidate) {
    throw new Error('Candidato no encontrado');
  }

  const prompt = buildAnalysisPrompt(candidate);

  const response = await groqClient.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `Eres un experto reclutador técnico con 10 años de experiencia en IT.
Tu tarea es analizar currículums y devolver un JSON estricto con la evaluación.

Reglas:
- Evalúa objetivamente basándote SOLO en la información proporcionada
- El technicalScore (0-100) mide la solidez técnica del perfil
- El generalScore (0-100) es una evaluación global del candidato
- La seniority debe ser: JUNIOR, MID, SENIOR o LEAD. Evalúa la seniority basándote ÚNICAMENTE en la experiencia relevante en desarrollo de software, tecnología o IT. NO consideres experiencia laboral en áreas no tecnológicas o no relacionadas (como técnico de sonido, hostelería, etc.) para el cálculo de años de seniority en tecnología.
- Fortalezas y debilidades: máximo 5 items cada una, concisos
- La justificación debe explicar por qué se asignaron esos scores

Devuelve SIEMPRE un JSON válido con este formato exacto:
{
  "summary": "string (2-3 frases sobre el perfil)",
  "seniority": "JUNIOR|MID|SENIOR|LEAD",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "technicalScore": number,
  "generalScore": number,
  "justification": "string"
}`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('La IA no devolvió contenido');
  }

  const analysis: AnalysisResult = JSON.parse(content);

  analysis.technicalScore = Math.min(100, Math.max(0, analysis.technicalScore));
  analysis.generalScore = Math.min(100, Math.max(0, analysis.generalScore));

  // Re-parse resume data using the updated AI parser to fix category mixes
  if (candidate.resume?.rawText) {
    const { parseResumeWithAI } = require('./parsing');
    try {
      const parsed = await parseResumeWithAI(candidate.resume.rawText);
      await prisma.$transaction([
        prisma.experience.deleteMany({ where: { candidateId } }),
        prisma.education.deleteMany({ where: { candidateId } }),
        prisma.skill.deleteMany({ where: { candidateId } }),
        prisma.candidate.update({
          where: { id: candidateId },
          data: {
            name: parsed.name || candidate.name,
            email: parsed.email || candidate.email,
            phone: parsed.phone || candidate.phone,
            linkedin: parsed.linkedin || candidate.linkedin,
            seniority: parsed.seniority || analysis.seniority,
            summary: analysis.summary,
            strengths: analysis.strengths,
            weaknesses: analysis.weaknesses,
            technicalScore: analysis.technicalScore,
            generalScore: analysis.generalScore,
            justification: analysis.justification,
            experiences: {
              create: (parsed.experiences || []).map((exp: any) => ({
                company: exp.company,
                position: exp.position,
                startDate: exp.startDate,
                endDate: exp.endDate || null,
                description: exp.description || null,
                technologies: exp.technologies || [],
              })),
            },
            education: {
              create: (parsed.educations || []).map((edu: any) => ({
                institution: edu.institution,
                degree: edu.degree,
                field: edu.field || "",
                startDate: edu.startDate,
                endDate: edu.endDate || null,
              })),
            },
            skills: {
              create: (parsed.skills || []).map((name: string) => ({
                name,
                category: "TECHNICAL",
                level: 3,
              })),
            },
          },
        }),
      ]);
    } catch (parseError) {
      console.error('Error re-parsing during analysis:', parseError);
      // Fallback: update candidate without re-parsing experiences
      await prisma.candidate.update({
        where: { id: candidateId },
        data: {
          summary: analysis.summary,
          seniority: analysis.seniority,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          technicalScore: analysis.technicalScore,
          generalScore: analysis.generalScore,
          justification: analysis.justification,
        },
      });
    }
  } else {
    await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        summary: analysis.summary,
        seniority: analysis.seniority,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        technicalScore: analysis.technicalScore,
        generalScore: analysis.generalScore,
        justification: analysis.justification,
      },
    });
  }

  return analysis;
}

function buildAnalysisPrompt(candidate: any): string {
  const experiences = candidate.experiences.map((exp: any) => 
    `- ${exp.position} en ${exp.company} (${exp.startDate} - ${exp.endDate || 'Actual'})
     ${exp.description || ''}
     Tecnologías: ${exp.technologies?.join(', ') || 'No especificadas'}`
  ).join('\n');

  const education = candidate.education.map((edu: any) => 
    `- ${edu.degree} en ${edu.field} en ${edu.institution} (${edu.startDate} - ${edu.endDate || 'Actual'})`
  ).join('\n');

  const skills = candidate.skills.map((skill: any) => 
    `- ${skill.name} (${skill.category}, nivel ${skill.level}/5)`
  ).join('\n');

  return `ANÁLISIS DE CANDIDATO

NOMBRE: ${candidate.name || 'No detectado'}
EMAIL: ${candidate.email || 'No detectado'}
TELÉFONO: ${candidate.phone || 'No detectado'}
LINKEDIN: ${candidate.linkedin || 'No detectado'}
UBICACIÓN: ${candidate.location || 'No disponible'}

EXPERIENCIA LABORAL:
${experiences || 'No detectada'}

FORMACIÓN ACADÉMICA:
${education || 'No detectada'}

SKILLS TÉCNICAS:
${skills || 'No detectadas'}

TEXTO COMPLETO DEL CV:
${candidate.resume?.rawText?.substring(0, 3000) || 'No disponible'}

---

Analiza este perfil y devuelve el JSON con la evaluación.`;
}