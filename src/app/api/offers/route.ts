import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const offerSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  company: z.string().min(1, 'La empresa es requerida'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  requirements: z.string().optional(),
  seniority: z.enum(['JUNIOR', 'MID', 'SENIOR', 'LEAD']).optional(),
  location: z.string().optional(),
  isRemote: z.boolean().optional().default(false),
  skills: z.array(z.string()).optional().default([]),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const seniority = searchParams.get('seniority');
    const isRemote = searchParams.get('isRemote');

    const where: any = {
      userId: session.user.id,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (seniority) {
      where.seniority = seniority;
    }

    if (isRemote !== null) {
      where.isRemote = isRemote === 'true';
    }

    const offers = await prisma.jobOffer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { matches: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      offers,
    });

  } catch (error) {
    console.error('Error listando ofertas:', error);
    return NextResponse.json(
      { error: 'Error listando ofertas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    
    const validated = offerSchema.parse(body);

    const offer = await prisma.jobOffer.create({
      data: {
        ...validated,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      offer,
      message: 'Oferta creada exitosamente',
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error creando oferta:', error);
    return NextResponse.json(
      { error: 'Error creando oferta' },
      { status: 500 }
    );
  }
}