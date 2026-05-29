// src/app/api/offers/[id]/match/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { calculateMatchesForOffer } from '@/lib/matching';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: jobOfferId } = await params;

    const results = await calculateMatchesForOffer(jobOfferId, session.user.id);

    // Ordenar por score desc
    const sorted = results.sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0));

    return NextResponse.json({
      success: true,
      matches: sorted,
      total: sorted.length,
    });
  } catch (error) {
    console.error('Error calculando matches:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error calculando matches' },
      { status: 500 }
    );
  }
}