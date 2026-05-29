import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Convertimos params a Promise
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params; // Esperamos a que los params se resuelvan

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

    const messages = await prisma.chatMessage.findMany({
      where: { candidateId: id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      messages,
    });

  } catch (error) {
    console.error('Error obteniendo historial de chat:', error);
    return NextResponse.json(
      { error: 'Error obteniendo historial' },
      { status: 500 }
    );
  }
}