import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { processCandidateEmbeddings } from '@/lib/embeddings';
import { embeddingRateLimit, applyRateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rateLimitResponse = await applyRateLimit(
      embeddingRateLimit,
      `embeddings:${session.user.id}`,
      request
    );
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { candidateId } = body;

    if (!candidateId) {
      return NextResponse.json(
        { error: 'candidateId requerido' },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.findFirst({
      where: { 
        id: candidateId,
        userId: session.user.id 
      },
      include: { resume: true },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidato no encontrado' },
        { status: 404 }
      );
    }

    if (!candidate.resume?.rawText) {
      return NextResponse.json(
        { error: 'El candidato no tiene texto de CV para procesar' },
        { status: 400 }
      );
    }

    await processCandidateEmbeddings(candidateId);

    const count = await prisma.embedding.count({
      where: { candidateId },
    });

    return NextResponse.json({
      success: true,
      message: 'Embeddings generados exitosamente',
      embeddingsCount: count,
    });

  } catch (error) {
    console.error('Error generando embeddings:', error);
    return NextResponse.json(
      { error: 'Error generando embeddings' },
      { status: 500 }
    );
  }
}