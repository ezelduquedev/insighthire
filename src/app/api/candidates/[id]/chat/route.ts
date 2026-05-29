import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { groqClient, MODEL } from '@/lib/openai';
import { searchSimilarChunks, processCandidateEmbeddings, SimilarChunk } from '@/lib/embeddings';
import { aiChatRateLimit, applyRateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const rateLimitResponse = await applyRateLimit(
      aiChatRateLimit,
      `chat:${session.user.id}`,
      request
    );
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Mensaje requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const candidate = await prisma.candidate.findFirst({
      where: { 
        id,
        userId: session.user.id 
      },
      include: { resume: true },
    });

    if (!candidate) {
      return new Response(
        JSON.stringify({ error: 'Candidato no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const embeddingCount = await prisma.embedding.count({
      where: { candidateId: id },
    });

    if (embeddingCount === 0) {
      console.log(`[Chat RAG] Sin embeddings para ${id}, generando...`);
      try {
        await processCandidateEmbeddings(id);
        console.log(`[Chat RAG] Embeddings generados correctamente para ${id}`);
      } catch (embError) {
        console.error('[Chat RAG] Error generando embeddings:', embError);
      }
    }

    const relevantChunks: SimilarChunk[] = await searchSimilarChunks(message, id, 5);

    const context = relevantChunks.length > 0
      ? relevantChunks
          .map((chunk: SimilarChunk, i: number) => `[${i + 1}] ${chunk.content}`)
          .join('\n\n')
      : 'No hay información estructurada disponible del CV.';

    const sources = relevantChunks.map((chunk: SimilarChunk) => ({
      content: chunk.content,
      chunkType: chunk.chunkType,
      similarity: chunk.similarity,
    }));

    const systemPrompt = `Eres un asistente de reclutamiento experto. Estás analizando el CV de un candidato.

INSTRUCCIONES IMPORTANTES:
- Responde ÚNICAMENTE basándote en la información del CV proporcionada abajo
- Si la información no está en el CV, di "No tengo esa información en el CV"
- No inventes datos ni hagas suposiciones
- Sé conciso y profesional
- Usa español para responder

CONTEXTO DEL CV:
${context}

Nombre del candidato: ${candidate.name || 'No disponible'}
`;

    const stream = await groqClient.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.3,
      max_tokens: 1500,
      stream: true,
    });

    await prisma.chatMessage.create({
      data: {
        candidateId: id,
        role: 'USER',
        content: message,
      },
    });

    const encoder = new TextEncoder();
    let fullResponse = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              );
            }
          }

          await prisma.chatMessage.create({
            data: {
              candidateId: id,
              role: 'ASSISTANT',
              content: fullResponse,
            },
          });

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, sources })}\n\n`)
          );
          controller.close();
        } catch (streamError) {
          console.error('Error en streaming:', streamError);
          controller.error(streamError);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error en chat RAG:', error);
    return new Response(
      JSON.stringify({ error: 'Error en el chat' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}