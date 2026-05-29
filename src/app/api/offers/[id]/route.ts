import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const offerUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  company: z.string().min(1).optional(),
  description: z.string().min(10).optional(),
  requirements: z.string().optional(),
  seniority: z.enum(['JUNIOR', 'MID', 'SENIOR', 'LEAD']).optional(),
  location: z.string().optional(),
  isRemote: z.boolean().optional(),
  skills: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const offer = await prisma.jobOffer.findFirst({
      where: { 
        id,
        userId: session.user.id 
      },
      include: {
        matches: {
          include: {
            candidate: true,
          },
          orderBy: { score: 'desc' },
        },
      },
    });

    if (!offer) {
      return NextResponse.json(
        { error: 'Oferta no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      offer,
    });

  } catch (error) {
    console.error('Error obteniendo oferta:', error);
    return NextResponse.json(
      { error: 'Error obteniendo oferta' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.jobOffer.findFirst({
      where: { 
        id,
        userId: session.user.id 
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Oferta no encontrada' },
        { status: 404 }
      );
    }

    const validated = offerUpdateSchema.parse(body);

    const offer = await prisma.jobOffer.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json({
      success: true,
      offer,
      message: 'Oferta actualizada exitosamente',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error actualizando oferta:', error);
    return NextResponse.json(
      { error: 'Error actualizando oferta' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.jobOffer.findFirst({
      where: { 
        id,
        userId: session.user.id 
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Oferta no encontrada' },
        { status: 404 }
      );
    }

    await prisma.jobOffer.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Oferta eliminada exitosamente',
    });

  } catch (error) {
    console.error('Error eliminando oferta:', error);
    return NextResponse.json(
      { error: 'Error eliminando oferta' },
      { status: 500 }
    );
  }
}