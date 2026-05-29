import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userId = session.user.id

    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const [totalCandidates, newThisWeek, activeOffers, allCandidates] = await Promise.all([
      prisma.candidate.count({ where: { userId } }),
      prisma.candidate.count({ where: { userId, createdAt: { gte: oneWeekAgo } } }),
      prisma.jobOffer.count({ where: { userId, isActive: true } }),
      prisma.candidate.findMany({
        where: { userId },
        select: { seniority: true, technicalScore: true, createdAt: true },
      }),
    ])

    // Score medio
    const avgScore = allCandidates.length
      ? Math.round(allCandidates.reduce((acc, c) => acc + (c.technicalScore || 0), 0) / allCandidates.length)
      : 0

    // Por seniority
    const bySeniority: Record<string, number> = {}
    for (const c of allCandidates) {
      const s = c.seniority || "JUNIOR"
      bySeniority[s] = (bySeniority[s] || 0) + 1
    }

    // Por semana (últimas 6 semanas)
    const byWeekMap: Record<string, number> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i * 7)
      const key = `S${d.getDate()}/${d.getMonth() + 1}`
      byWeekMap[key] = 0
    }
    for (const c of allCandidates) {
      const d = new Date(c.createdAt)
      const key = `S${d.getDate()}/${d.getMonth() + 1}`
      if (key in byWeekMap) byWeekMap[key]++
    }
    const byWeek = Object.entries(byWeekMap).map(([week, count]) => ({ week, count }))

    return NextResponse.json({
      totalCandidates,
      newThisWeek,
      activeOffers,
      avgScore,
      bySeniority,
      byWeek,
    })
  } catch (error) {
    console.error("Error dashboard:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}