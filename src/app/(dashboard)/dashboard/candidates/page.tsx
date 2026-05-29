"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Search, Star, Filter, Download, FileText, Trash2, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

type Skill = { id: string; name: string; category: string }
type Candidate = {
  id: string
  name: string
  email: string
  phone?: string
  location?: string
  seniority?: string
  status: string
  favorite: boolean
  technicalScore: number
  generalScore: number
  summary?: string
  createdAt: string
  skills: Skill[]
  experiences?: Array<{ company: string; position: string; startDate: string; endDate?: string | null }>
}

const STATUS_BADGE: Record<string, string> = {
  NEW:                  "ih-badge-blue",
  IN_REVIEW:            "ih-badge-yellow",
  TECHNICAL_INTERVIEW:  "ih-badge-violet",
  CULTURAL_INTERVIEW:   "ih-badge-orange",
  OFFER_SENT:           "ih-badge-green",
  HIRED:                "ih-badge-green",
  REJECTED:             "ih-badge-red",
  ARCHIVED:             "ih-badge-slate",
}

const STATUS_LABELS: Record<string, string> = {
  NEW:                 "Nuevo",
  IN_REVIEW:           "En revisión",
  TECHNICAL_INTERVIEW: "Entrevista técnica",
  CULTURAL_INTERVIEW:  "Entrevista cultural",
  OFFER_SENT:          "Oferta enviada",
  HIRED:               "Contratado",
  REJECTED:            "Rechazado",
  ARCHIVED:            "Archivado",
}

const SENIORITY_BADGE: Record<string, string> = {
  JUNIOR: "ih-badge-cyan",
  MID:    "ih-badge-indigo",
  SENIOR: "ih-badge-violet",
  LEAD:   "ih-badge-amber",
}

const FILTER_STATUS = ["", "NEW", "IN_REVIEW", "HIRED", "REJECTED"]

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [exportingCSV, setExportingCSV] = useState(false)
  const [exportingPDF, setExportingPDF] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const searchParams = useSearchParams()
  useEffect(() => {
    const q = searchParams.get("search")
    if (q) setSearch(q)
  }, []) // eslint-disable-line

  const limit = 10

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchCandidates = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), search: debouncedSearch, status: statusFilter })
    const res = await fetch(`/api/candidates?${params}`)
    const data = await res.json()
    setCandidates(data.candidates || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [page, debouncedSearch, statusFilter])

  useEffect(() => { fetchCandidates() }, [fetchCandidates])

  const totalPages = Math.ceil(total / limit)

  const handleExportCSV = async () => {
    setExportingCSV(true)
    try {
      const params = new URLSearchParams({ limit: "200", search: debouncedSearch, status: statusFilter })
      const res = await fetch(`/api/candidates?${params}`)
      const data = await res.json()
      exportToCSV(data.candidates ?? [], "candidatos_insighthire.csv")
    } finally { setExportingCSV(false) }
  }

  const handleExportPDF = async (c: Candidate) => {
    setExportingPDF(c.id)
    try {
      const res = await fetch(`/api/candidates/${c.id}`)
      const data = await res.json()
      await exportToPDF(data.candidate ?? c)
    } finally { setExportingPDF(null) }
  }

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id)
      setTimeout(() => setConfirmDeleteId(null), 3000)
      return
    }
    setDeletingId(id); setConfirmDeleteId(null)
    try {
      await fetch(`/api/candidates/${id}`, { method: "DELETE" })
      setCandidates(prev => prev.filter(c => c.id !== id))
      setTotal(prev => prev - 1)
    } finally { setDeletingId(null) }
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="ih-page-title">Candidatos</h1>
          <p className="ih-page-subtitle">{total} candidatos en total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={exportingCSV || candidates.length === 0}
            className="ih-btn ih-btn-ghost text-sm cursor-pointer"
          >
            {exportingCSV ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            CSV
          </button>
          <Link href="/dashboard/upload">
            <button className="ih-btn ih-btn-primary text-sm cursor-pointer">+ Subir CV</button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="ih-search flex-1 min-w-[200px] max-w-xs">
          <Search className="h-4 w-4 flex-shrink-0" style={{ color: "var(--ih-text-muted)" }} />
          <input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_STATUS.map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className="ih-tab cursor-pointer"
              style={statusFilter === s ? { background: "var(--ih-accent-soft)", color: "var(--ih-accent)" } : {}}
            >
              {s === "" ? "Todos" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="ih-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--ih-accent)" }} />
          </div>
        ) : candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <Filter className="h-8 w-8" style={{ color: "var(--ih-text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--ih-text-muted)" }}>
              No hay candidatos. ¡Sube el primero!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="ih-table">
              <thead>
                <tr>
                  <th>Candidato</th>
                  <th>Seniority</th>
                  <th>Estado</th>
                  <th>Skills</th>
                  <th>Score</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="ih-avatar">{(c.name ?? "?")[0].toUpperCase()}</div>
                        <div>
                          <p className="font-medium text-sm" style={{ color: "var(--ih-text-primary)" }}>
                            {c.name}
                          </p>
                          <p className="text-xs" style={{ color: "var(--ih-text-muted)" }}>{c.email}</p>
                        </div>
                        {c.favorite && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />}
                      </div>
                    </td>
                    <td>
                      {c.seniority && (
                        <span className={`ih-badge ${SENIORITY_BADGE[c.seniority] ?? "ih-badge-slate"}`}>
                          {c.seniority}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`ih-badge ${STATUS_BADGE[c.status] ?? "ih-badge-slate"}`}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1 flex-wrap max-w-[180px]">
                        {c.skills.slice(0, 3).map(s => (
                          <span key={s.id} className="ih-badge ih-badge-slate">{s.name}</span>
                        ))}
                        {c.skills.length > 3 && (
                          <span className="ih-badge ih-badge-slate">+{c.skills.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="ih-score-track w-14">
                          <div className="ih-score-fill" style={{ width: `${c.technicalScore ?? 0}%` }} />
                        </div>
                        <span className="text-xs font-medium" style={{ color: "var(--ih-text-secondary)" }}>
                          {c.technicalScore ?? "—"}%
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => handleExportPDF(c)}
                          disabled={exportingPDF === c.id}
                          title="Exportar PDF"
                          className="p-1.5 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                          style={{ color: "var(--ih-text-muted)" }}
                        >
                          {exportingPDF === c.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <FileText className="h-4 w-4" />
                          }
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          title={confirmDeleteId === c.id ? "Clic de nuevo para confirmar" : "Eliminar"}
                          className="p-1.5 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                          style={{ color: confirmDeleteId === c.id ? "var(--ih-danger)" : "var(--ih-text-muted)" }}
                        >
                          {deletingId === c.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />
                          }
                        </button>
                        <Link href={`/dashboard/candidates/${c.id}`}>
                          <button className="ih-btn ih-btn-ghost cursor-pointer" style={{ padding: ".25rem .75rem", fontSize: ".8125rem" }}>
                            Ver
                          </button>
                        </Link>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: "var(--ih-text-muted)" }}>
            Mostrando {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total}
          </p>
          <div className="flex gap-2">
            <button
              className="ih-btn ih-btn-ghost cursor-pointer"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </button>
            <button
              className="ih-btn ih-btn-ghost cursor-pointer"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Siguiente <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Helpers (mantienen la misma lógica) ──────────────────────────────────────
function exportToCSV(candidates: Candidate[], filename: string) {
  const esc = (v: unknown) => {
    const t = v == null ? "" : String(v)
    return t.match(/[",\n\r]/) ? `"${t.replace(/"/g, '""')}"` : t
  }
  const header = ["ID","Nombre","Email","Teléfono","Ubicación","Seniority","Estado","Favorito","Score Técnico","Score General","Resumen","Creado","Skills","Experiencias"]
  const rows = candidates.map(c => [
    c.id, c.name, c.email, c.phone??'', c.location??'',
    c.seniority??'', STATUS_LABELS[c.status]??c.status,
    c.favorite?'Sí':'No', c.technicalScore??'', c.generalScore??'',
    c.summary??'', c.createdAt,
    c.skills.map(s=>s.name).join(', '),
    (c.experiences??[]).map(e=>`${e.company}|${e.position}|${e.startDate}${e.endDate?` - ${e.endDate}`:' - Present'}`).join(' ; '),
  ])
  const csv = [header,...rows].map(r=>r.map(esc).join(',')).join('\r\n')
  const a = Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})),download:filename})
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
}

async function exportToPDF(candidate: Candidate) {
  try {
    const res = await fetch('/api/export/pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(candidate)})
    if (!res.ok) throw new Error()
    const url = URL.createObjectURL(await res.blob())
    const a = Object.assign(document.createElement('a'),{href:url,download:`${candidate.name}.pdf`})
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  } catch(e){ console.error('PDF error',e) }
}