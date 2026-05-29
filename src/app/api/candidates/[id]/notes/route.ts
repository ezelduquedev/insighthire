// src/app/api/candidates/[id]/notes/route.ts  (archivo nuevo)
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

    const { id: candidateId } = await params

    // Verificar ownership
    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, userId: session.user.id },
    })
    if (!candidate) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    const notes = await prisma.note.findMany({
      where: { candidateId },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({ success: true, notes })
  } catch (error) {
    console.error("Error obteniendo notas:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id: candidateId } = await params
    const { content } = await req.json()

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Contenido requerido" }, { status: 400 })
    }

    // Verificar ownership
    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, userId: session.user.id },
    })
    if (!candidate) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    // Upsert: una sola nota por candidato (se sobreescribe con cada guardado)
    const existingNote = await prisma.note.findFirst({ where: { candidateId } })

    let note
    if (existingNote) {
      note = await prisma.note.update({
        where: { id: existingNote.id },
        data: { content },
      })
    } else {
      note = await prisma.note.create({
        data: { content, candidateId },
      })
    }

    return NextResponse.json({ success: true, note })
  } catch (error) {
    console.error("Error guardando nota:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}