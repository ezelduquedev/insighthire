import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { analyzeCandidate } from '@/lib/analysis';
import { aiAnalysisRateLimit, applyRateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rateLimitResponse = await applyRateLimit(
      aiAnalysisRateLimit,
      `analysis:${session.user.id}`,
      request
    );
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;

    const candidate = await prisma.candidate.findFirst({
      where: { 
        id,
        userId: session.user.id 
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidato no encontrado' },
        { status: 404 }
      );
    }

    const analysis = await analyzeCandidate(id);

    return NextResponse.json({
      success: true,
      analysis,
      message: 'Análisis completado exitosamente',
    });

  } catch (error) {
    console.error('Error en análisis de candidato:', error);
    
    if (error instanceof Error && error.message.includes('API')) {
      return NextResponse.json(
        { 
          error: 'Error en el servicio de IA',
          message: 'El servicio de análisis no está disponible momentáneamente. Inténtalo más tarde.' 
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}