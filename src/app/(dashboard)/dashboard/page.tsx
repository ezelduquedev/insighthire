"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Users, TrendingUp, FileCheck, Target } from "lucide-react"
import {
  PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts"

interface DashboardStats {
  totalCandidates: number
  newThisWeek: number
  activeOffers: number
  avgScore: number
  byStatus: Record<string, number>
  bySeniority: Record<string, number>
  byWeek: { week: string; count: number }[]
}

const SENIORITY_COLORS: Record<string, string> = {
  JUNIOR: "#0891B2",
  MID:    "#4F62D0",
  SENIOR: "#7C3AED",
  LEAD:   "#D97706",
}

const statCards = [
  { label: "Total Candidatos",   key: "totalCandidates", icon: Users,      bg: "#EFF6FF", color: "#3B82F6" },
  { label: "Nuevos esta semana", key: "newThisWeek",      icon: TrendingUp, bg: "#ECFDF5", color: "#10B981" },
  { label: "Ofertas Activas",    key: "activeOffers",     icon: FileCheck,  bg: "#F5F3FF", color: "#7C3AED" },
  { label: "Score Medio",        key: "avgScore",         icon: Target,     bg: "#FFF7ED", color: "#EA580C", suffix: "%" },
] as const

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const seniorityData = stats?.bySeniority
    ? Object.entries(stats.bySeniority).map(([name, value]) => ({ name, value }))
    : []

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="ih-page-title">Dashboard</h1>
        <p className="ih-page-subtitle">Bienvenido de vuelta a InsightHire</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon
          const raw = stats?.[card.key] ?? 0
          const value = "suffix" in card ? `${raw}${card.suffix}` : raw
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="ih-card flex items-center gap-4">
                <div
                  className="ih-stat-icon flex-shrink-0"
                  style={{ background: card.bg }}
                >
                  <Icon className="h-5 w-5" style={{ color: card.color }} />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--ih-text-muted)" }}>
                    {card.label}
                  </p>
                  {loading
                    ? <div className="ih-skeleton h-7 w-14 mt-1" />
                    : <p className="text-2xl font-bold" style={{ color: "var(--ih-text-primary)" }}>{value}</p>
                  }
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Line chart */}
        <div className="ih-card">
          <p className="text-sm font-semibold mb-4" style={{ color: "var(--ih-text-primary)" }}>
            Candidatos por semana
          </p>
          {loading
            ? <div className="ih-skeleton h-56 w-full" />
            : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats?.byWeek || []}>
                  <XAxis
                    dataKey="week"
                    stroke="var(--ih-border)"
                    tick={{ fill: "var(--ih-text-muted)", fontSize: 11 }}
                  />
                  <YAxis
                    stroke="var(--ih-border)"
                    tick={{ fill: "var(--ih-text-muted)", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--ih-surface)",
                      border: "1px solid var(--ih-border)",
                      borderRadius: 8,
                      boxShadow: "0 4px 12px rgba(0,0,0,.06)",
                    }}
                    labelStyle={{ color: "var(--ih-text-primary)", fontWeight: 600 }}
                    itemStyle={{ color: "var(--ih-accent)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="var(--ih-accent)"
                    strokeWidth={2}
                    dot={{ fill: "var(--ih-accent)", r: 3.5 }}
                    name="Candidatos"
                  />
                </LineChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Donut chart */}
        <div className="ih-card">
          <p className="text-sm font-semibold mb-4" style={{ color: "var(--ih-text-primary)" }}>
            Distribución por seniority
          </p>
          {loading
            ? <div className="ih-skeleton h-56 w-full" />
            : seniorityData.length === 0
            ? (
              <div className="h-56 flex items-center justify-center text-sm" style={{ color: "var(--ih-text-muted)" }}>
                Sin datos aún
              </div>
            )
            : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="55%" height={220}>
                  <PieChart>
                    <Pie
                      data={seniorityData}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={85}
                      dataKey="value"
                    >
                      {seniorityData.map(entry => (
                        <Cell key={entry.name} fill={SENIORITY_COLORS[entry.name] || "#8C95A6"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--ih-surface)",
                        border: "1px solid var(--ih-border)",
                        borderRadius: 8,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2.5">
                  {seniorityData.map(entry => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: SENIORITY_COLORS[entry.name] || "#8C95A6" }}
                      />
                      <span className="text-xs" style={{ color: "var(--ih-text-muted)" }}>{entry.name}</span>
                      <span className="text-sm font-semibold ml-auto" style={{ color: "var(--ih-text-primary)" }}>
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}