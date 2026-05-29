import { prisma } from './prisma';

interface MockAnalysisResult {
  summary: string;
  seniority: 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD';
  strengths: string[];
  weaknesses: string[];
  technicalScore: number;
  generalScore: number;
  justification: string;
}

const MOCK_ANALYSES: Record<string, MockAnalysisResult> = {
  frontend: {
    summary: 'Desarrollador frontend con sólida experiencia en React y TypeScript. Perfil orientado a la creación de interfaces modernas y responsivas.',
    seniority: 'MID',
    strengths: ['Experiencia sólida en React', 'TypeScript avanzado', 'UI/UX consciente', 'Trabajo en equipo'],
    weaknesses: ['Falta experiencia en backend', 'No menciona testing automatizado', 'Sin experiencia en CI/CD'],
    technicalScore: 72,
    generalScore: 75,
    justification: 'Perfil técnico sólido en frontend con buena experiencia en tecnologías modernas. Necesita ampliar conocimientos en testing y DevOps para ser fullstack.',
  },
  backend: {
    summary: 'Backend developer especializado en Node.js y bases de datos SQL/NoSQL. Experiencia en arquitectura de APIs RESTful.',
    seniority: 'MID',
    strengths: ['Node.js avanzado', 'Diseño de APIs RESTful', 'PostgreSQL y MongoDB', 'Optimización de queries'],
    weaknesses: ['Sin experiencia en frontend', 'No menciona Docker/Kubernetes', 'Falta experiencia en cloud'],
    technicalScore: 75,
    generalScore: 73,
    justification: 'Perfil backend muy sólido con buena experiencia en bases de datos. Recomendable para roles de backend puro.',
  },
  fullstack: {
    summary: 'Fullstack developer con experiencia equilibrada en frontend y backend. Capaz de desarrollar aplicaciones completas de principio a fin.',
    seniority: 'SENIOR',
    strengths: ['Fullstack completo', 'React y Node.js', 'Bases de datos', 'Arquitectura de software'],
    weaknesses: ['Sin mención de testing E2E', 'Falta experiencia en microservicios'],
    technicalScore: 82,
    generalScore: 80,
    justification: 'Perfil muy completo con experiencia en todo el stack. Ideal para startups y equipos pequeños.',
  },
  devops: {
    summary: 'DevOps Engineer con experiencia en CI/CD, Docker, Kubernetes y cloud infrastructure.',
    seniority: 'SENIOR',
    strengths: ['CI/CD pipelines', 'Docker y Kubernetes', 'AWS/Azure', 'Infraestructura como código'],
    weaknesses: ['Sin experiencia en desarrollo', 'Falta conocimientos de seguridad avanzada'],
    technicalScore: 78,
    generalScore: 76,
    justification: 'Perfil especializado en DevOps con buena experiencia en herramientas modernas.',
  },
  data: {
    summary: 'Data Engineer/Data Scientist con experiencia en procesamiento de datos, machine learning y visualización.',
    seniority: 'MID',
    strengths: ['Python avanzado', 'Pandas y NumPy', 'Machine Learning', 'SQL complejo'],
    weaknesses: ['Sin experiencia en producción de ML', 'Falta conocimientos de MLOps'],
    technicalScore: 70,
    generalScore: 72,
    justification: 'Perfil de datos con buena base técnica. Necesita más experiencia en producción de modelos.',
  },
  junior: {
    summary: 'Junior developer con conocimientos básicos en desarrollo web. Perfil en crecimiento con potencial.',
    seniority: 'JUNIOR',
    strengths: ['Conocimientos básicos sólidos', 'Motivación por aprender', 'HTML/CSS/JavaScript'],
    weaknesses: ['Poca experiencia profesional', 'Sin proyectos complejos', 'Falta conocimiento de frameworks'],
    technicalScore: 45,
    generalScore: 50,
    justification: 'Perfil junior con buena base. Requiere mentoría y proyectos desafiantes para crecer.',
  },
  lead: {
    summary: 'Tech Lead con amplia experiencia técnica y de liderazgo. Capaz de dirigir equipos y tomar decisiones arquitectónicas.',
    seniority: 'LEAD',
    strengths: ['Liderazgo técnico', 'Arquitectura de software', 'Mentoría', 'Toma de decisiones'],
    weaknesses: ['Poca experiencia hands-on reciente', 'Foco en gestión sobre código'],
    technicalScore: 85,
    generalScore: 88,
    justification: 'Perfil de liderazgo muy sólido. Ideal para roles de Tech Lead o Engineering Manager.',
  },
};

export async function mockAnalyzeCandidate(id: string): Promise<MockAnalysisResult> {
  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: {
      skills: true,
      experiences: true,
    },
  });

  if (!candidate) {
    throw new Error('Candidato no encontrado');
  }

  const skillNames = candidate.skills.map(s => s.name.toLowerCase());
  
  let profileType = 'junior';
  
  if (skillNames.some(s => ['react', 'vue', 'angular', 'frontend'].includes(s))) {
    profileType = 'frontend';
  }
  if (skillNames.some(s => ['node', 'python', 'java', 'backend', 'api'].includes(s))) {
    profileType = skillNames.some(s => ['react', 'vue', 'angular'].includes(s)) ? 'fullstack' : 'backend';
  }
  if (skillNames.some(s => ['docker', 'kubernetes', 'aws', 'devops', 'ci/cd'].includes(s))) {
    profileType = 'devops';
  }
  if (skillNames.some(s => ['python', 'machine learning', 'data', 'pandas', 'tensorflow'].includes(s))) {
    profileType = 'data';
  }
  if (candidate.experiences.length > 5) {
    profileType = 'lead';
  }

  const analysis = MOCK_ANALYSES[profileType];

  const formatTextArray = (items: string[]) => items.join(', ');

  await prisma.candidate.update({
    where: { id },
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

  return analysis;
}

export function mockChatResponse(message: string, candidateName: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('años') || lowerMessage.includes('experiencia')) {
    return `${candidateName} tiene varios años de experiencia en el sector tecnológico, trabajando en diferentes empresas y proyectos.`;
  }
  
  if (lowerMessage.includes('skill') || lowerMessage.includes('tecnología') || lowerMessage.includes('stack')) {
    return `Según el CV, ${candidateName} domina varias tecnologías relevantes para el puesto. Tiene experiencia práctica en su aplicación.`;
  }
  
  if (lowerMessage.includes('educación') || lowerMessage.includes('formación') || lowerMessage.includes('estudio')) {
    return `${candidateName} cuenta con formación académica relevante en el campo de la tecnología.`;
  }
  
  if (lowerMessage.includes('salario') || lowerMessage.includes('sueldo') || lowerMessage.includes('pretensión')) {
    return `No tengo información sobre expectativas salariales en el CV de ${candidateName}.`;
  }
  
  if (lowerMessage.includes('contacto') || lowerMessage.includes('teléfono') || lowerMessage.includes('email')) {
    return `Los datos de contacto de ${candidateName} están disponibles en su perfil.`;
  }
  
  return `Basándome en el CV de ${candidateName}, puedo confirmar que es un perfil interesante. ¿Te gustaría saber algo más específico sobre su experiencia o skills?`;
}