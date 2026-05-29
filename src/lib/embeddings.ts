import { EMBEDDING_MODEL } from './openai';
import { prisma } from './prisma';
import OpenAI from 'openai';

// Cliente separado para embeddings (OpenAI, Groq no soporta embeddings)
const embeddingClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Fallback local cuando OpenAI no está disponible o sin créditos
function localEmbedding(text: string): number[] {
  const vector = new Array(1536).fill(0);
  const tokens = text.toLowerCase().split(/\W+/).filter(Boolean);
  for (const token of tokens) {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = ((hash << 5) - hash + token.charCodeAt(i)) & 0xffffffff;
    }
    const idx = Math.abs(hash) % 1536;
    vector[idx] += 1;
  }
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map(v => v / magnitude);
}

async function getEmbedding(text: string): Promise<number[]> {
  if (embeddingClient) {
    try {
      const res = await embeddingClient.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
        encoding_format: 'float',
      });
      return res.data[0].embedding;
    } catch (err: any) {
      console.warn('[Embeddings] OpenAI falló, usando fallback local:', err?.code);
    }
  }
  console.warn('[Embeddings] Usando embedding local (sin OpenAI).');
  return localEmbedding(text);
}

const MAX_CHUNK_SIZE = 1024;
const OVERLAP_PERCENTAGE = 0.2;

export interface Chunk {
  content: string;
  chunkType: 'EXPERIENCE' | 'EDUCATION' | 'SKILLS' | 'SUMMARY' | 'GENERAL';
  metadata: Record<string, any>;
}

export interface EmbeddingResult {
  content: string;
  embedding: number[];
  chunkType: string;
  metadata: Record<string, any>;
}

export interface SimilarChunk {
  id: string;
  content: string;
  chunkType: string;
  metadata: Record<string, any>;
  similarity: number;
}

export async function chunkResume(candidateId: string): Promise<Chunk[]> {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      resume: true,
      experiences: true,
      education: true,
      skills: true,
    },
  });

  if (!candidate || !candidate.resume) {
    throw new Error('Candidato o resume no encontrado');
  }

  const chunks: Chunk[] = [];

  const experiences = (candidate.experiences as any[]) ?? [];
  for (const exp of experiences) {
    const content = `Experiencia: ${exp.position} en ${exp.company}
Período: ${exp.startDate} - ${exp.endDate || 'Actual'}
Descripción: ${exp.description || 'No disponible'}
Tecnologías: ${exp.technologies?.join(', ') || 'No especificadas'}`;

    chunks.push({
      content: truncateToMaxTokens(content),
      chunkType: 'EXPERIENCE',
      metadata: {
        company: exp.company,
        position: exp.position,
        startDate: exp.startDate,
        endDate: exp.endDate,
      },
    });
  }

  const education = (candidate.education as any[]) ?? [];
  for (const edu of education) {
    const content = `Educación: ${edu.degree} en ${edu.field}
Institución: ${edu.institution}
Período: ${edu.startDate} - ${edu.endDate || 'Actual'}`;

    chunks.push({
      content: truncateToMaxTokens(content),
      chunkType: 'EDUCATION',
      metadata: {
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field,
      },
    });
  }

  const skills = (candidate.skills as any[]) ?? [];
  if (skills.length > 0) {
    const skillsByCategory: Record<string, string[]> = {};
    for (const skill of skills) {
      if (!skillsByCategory[skill.category]) {
        skillsByCategory[skill.category] = [];
      }
      skillsByCategory[skill.category].push(`${skill.name} (nivel ${skill.level}/5)`);
    }

    const content = `Skills técnicas del candidato:
${Object.entries(skillsByCategory)
      .map(([cat, skillList]) => `${cat}: ${skillList.join(', ')}`)
      .join('\n')}`;

    chunks.push({
      content: truncateToMaxTokens(content),
      chunkType: 'SKILLS',
      metadata: { skillsCount: candidate.skills.length },
    });
  }

  const formatListField = (field?: string | string[] | null): string => {
    if (Array.isArray(field)) {
      return field.join(', ');
    }
    return field || 'No identificadas';
  };

  const summaryContent = `Perfil de ${candidate.name || 'Candidato'}
Email: ${candidate.email || 'No disponible'}
Teléfono: ${candidate.phone || 'No disponible'}
LinkedIn: ${candidate.linkedin || 'No disponible'}
Ubicación: ${candidate.location || 'No disponible'}
Seniority: ${candidate.seniority || 'No determinado'}
Summary: ${candidate.summary || 'No disponible'}
Fortalezas: ${formatListField(candidate.strengths as any)}
Debilidades: ${formatListField(candidate.weaknesses as any)}
Score Técnico: ${candidate.technicalScore || 'N/A'}
Score General: ${candidate.generalScore || 'N/A'}`;

  chunks.push({
    content: truncateToMaxTokens(summaryContent),
    chunkType: 'SUMMARY',
    metadata: { candidateName: candidate.name },
  });

  if (candidate.resume.rawText) {
    const rawChunks = splitTextIntoChunks(
      candidate.resume.rawText,
      MAX_CHUNK_SIZE,
      OVERLAP_PERCENTAGE
    );

    for (let i = 0; i < rawChunks.length; i++) {
      chunks.push({
        content: rawChunks[i],
        chunkType: 'GENERAL',
        metadata: {
          chunkIndex: i,
          totalChunks: rawChunks.length,
          source: 'raw_cv',
        },
      });
    }
  }

  return chunks;
}

export async function generateEmbeddings(chunks: Chunk[]): Promise<EmbeddingResult[]> {
  const results: EmbeddingResult[] = [];

  const batchSize = 100;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);

    const embeddings = await Promise.all(
      batch.map(chunk => getEmbedding(chunk.content))
    );

    for (let j = 0; j < batch.length; j++) {
      results.push({
        content: batch[j].content,
        embedding: embeddings[j],
        chunkType: batch[j].chunkType,
        metadata: batch[j].metadata,
      });
    }
  }

  return results;
}

export async function saveEmbeddings(
  candidateId: string,
  embeddings: EmbeddingResult[]
): Promise<void> {
  await prisma.embedding.deleteMany({
    where: { candidateId },
  });

  for (const emb of embeddings) {
    const vectorString = `[${emb.embedding.join(',')}]`;
    await prisma.$executeRaw`
      INSERT INTO "Embedding" (id, content, embedding, "chunkType", metadata, "candidateId", "createdAt")
      VALUES (
        gen_random_uuid(),
        ${emb.content},
        ${vectorString}::vector,
        ${emb.chunkType},
        ${JSON.stringify(emb.metadata)}::jsonb,
        ${candidateId},
        NOW()
      )
    `;
  }
}

export async function searchSimilarChunks(
  query: string,
  candidateId: string,
  limit: number = 5
): Promise<SimilarChunk[]> {
  const vector = await getEmbedding(query);
  const vectorString = `[${vector.join(',')}]`;

  const results = await prisma.$queryRaw<SimilarChunk[]>`
    SELECT 
      id,
      content,
      "chunkType",
      metadata,
      1 - (embedding <=> ${vectorString}::vector) as similarity
    FROM "Embedding"
    WHERE "candidateId" = ${candidateId}
    ORDER BY embedding <=> ${vectorString}::vector
    LIMIT ${limit}
  `;

  return results.map(r => ({
    id: r.id,
    content: r.content,
    chunkType: r.chunkType,
    metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
    similarity: Number(r.similarity),
  }));
}

export async function processCandidateEmbeddings(candidateId: string): Promise<void> {
  const chunks = await chunkResume(candidateId);
  const embeddings = await generateEmbeddings(chunks);
  await saveEmbeddings(candidateId, embeddings);
}

function truncateToMaxTokens(text: string, maxTokens: number = MAX_CHUNK_SIZE): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars) + '...';
}

function splitTextIntoChunks(
  text: string,
  chunkSize: number,
  overlapPercentage: number
): string[] {
  const maxChars = chunkSize * 4;
  const overlapChars = Math.floor(maxChars * overlapPercentage);
  const chunks: string[] = [];

  if (text.length <= maxChars) {
    return text.length > 0 ? [text] : [];
  }

  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length);
    chunks.push(text.substring(start, end));

    const nextStart = end - overlapChars;
    if (nextStart <= start) break;
    start = nextStart;
  }

  return chunks;
}