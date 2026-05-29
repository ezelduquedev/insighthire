// src/app/api/candidates/route.ts — REEMPLAZA completo
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { extractText, parseResumeWithAI } from "@/lib/parsing"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const seniority = searchParams.get("seniority") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const where: any = {
      userId: session.user.id,
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        status ? { status } : {},
        seniority ? { seniority } : {},
      ],
    }

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        include: { skills: true, resume: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.candidate.count({ where }),
    ])

    return NextResponse.json({ candidates, total, page, limit })
  } catch (error) {
    console.error("Error listando candidatos:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { fileUrl, fileName, fileType } = body

    if (!fileUrl) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    const rawText = await extractText(fileUrl, fileType)
    const parsed = await parseResumeWithAI(rawText)

    const candidate = await prisma.candidate.create({
      data: {
        name: parsed.name || "Sin nombre",
        email: parsed.email || `candidato-${Date.now()}@insighthire.com`,
        phone: parsed.phone || null,
        linkedin: parsed.linkedin || null,
        seniority: parsed.seniority as any,
        status: "NEW",
        userId: session.user.id,
        resume: {
          create: {
            fileName,
            fileUrl,
            fileType,
            rawText,
            parsedData: parsed as any,
          },
        },
        skills: {
          create: (parsed.skills || []).map((name: string) => ({
            name,
            category: "TECHNICAL",
            level: 3,
          })),
        },
        // ── Guardar experiencias parseadas ───────────────────────────────────
        experiences: {
          create: (parsed.experiences || []).map((exp) => ({
            company: exp.company,
            position: exp.position,
            startDate: exp.startDate,
            endDate: exp.endDate || null,
            description: exp.description || null,
            technologies: exp.technologies || [],
          })),
        },
        // ── Guardar educación parseada ───────────────────────────────────────
        education: {
          create: (parsed.educations || []).map((edu) => ({
            institution: edu.institution,
            degree: edu.degree,
            field: edu.field || "",
            startDate: edu.startDate,
            endDate: edu.endDate || null,
          })),
        },
      },
      include: {
        skills: true,
        resume: true,
        experiences: true,
        education: true,
      },
    })

    return NextResponse.json({ success: true, candidate }, { status: 201 })
  } catch (error) {
    console.error("Error creando candidato:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}