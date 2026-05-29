import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { searchSimilarChunks } from '@/lib/embeddings';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { query, candidateId, limit = 5 } = body;

    if (!query || !candidateId) {
      return NextResponse.json(
        { error: 'query y candidateId son requeridos' },
        { status: 400 }
      );
    }

    const results = await searchSimilarChunks(query, candidateId, limit);

    return NextResponse.json({
      success: true,
      results,
      query,
    });

  } catch (error) {
    console.error('Error en búsqueda semántica:', error);
    return NextResponse.json(
      { error: 'Error en búsqueda semántica' },
      { status: 500 }
    );
  }
}