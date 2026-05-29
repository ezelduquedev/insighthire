// src/app/api/candidates/[id]/route.ts
// REEMPLAZA el archivo actual
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    const candidate = await prisma.candidate.findFirst({
      where: { id, userId: session.user.id },
      include: {
        skills: true,
        resume: true,
        experiences: true,
        education: true,
        notes: { orderBy: { updatedAt: "desc" }, take: 1 },
      },
    })

    if (!candidate) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    return NextResponse.json({ candidate })
  } catch (error) {
    console.error("Error obteniendo candidato:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    // Verificar que el candidato pertenece al usuario
    const existing = await prisma.candidate.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    // Solo permitir actualizar campos seguros
    const allowed = ["favorite", "status", "name", "email", "phone", "location", "linkedin"]
    const data: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) data[key] = body[key]
    }

    const candidate = await prisma.candidate.update({
      where: { id },
      data,
      include: { skills: true, resume: true, experiences: true, education: true },
    })

    return NextResponse.json({ success: true, candidate })
  } catch (error) {
    console.error("Error actualizando candidato:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.candidate.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    await prisma.candidate.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error eliminando candidato:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}