// src/components/candidate-detail/CandidateDetail.tsx — REEMPLAZA completo
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Candidate } from '@/types'
import { ChatInterface } from '@/components/chat/ChatInterface'

function detectArea(tags: string[] | undefined | null): string {
  if (!tags || tags.length === 0) return 'unknown'
  const s = tags.join(' ').toLowerCase()
  if (s.includes('front') || s.includes('react') || s.includes('html') || s.includes('css')) return 'frontend'
  if (s.includes('back') || s.includes('node') || s.includes('python') || s.includes('java')) return 'backend'
  if (s.includes('data') || s.includes('ml') || s.includes('machine') || s.includes('science')) return 'data'
  if (s.includes('devops') || s.includes('docker') || s.includes('kubernetes') || s.includes('aws')) return 'devops'
  return 'other'
}

function getAreaColor(area: string) {
  switch (area) {
    case 'frontend': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'backend': return 'bg-green-100 text-green-800 border-green-200'
    case 'data': return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'devops': return 'bg-orange-100 text-orange-800 border-orange-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

import {
  Mail, Phone, ExternalLink, MapPin, Star, Brain, Briefcase,
  GraduationCap, Code, FileText, Loader2, Sparkles, TrendingUp,
  AlertTriangle, CheckCircle2, ArrowLeft, ChevronDown, StickyNote,
  Check, Tag, Calendar, Building2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CandidateDetailProps {
  candidate: Candidate
}

function formatDescription(desc: string | null | undefined) {
  if (!desc) return null;
  const paragraphs = desc.split(/\n+/).filter(p => p.trim());
  return (
    <div className="space-y-2 text-[var(--ih-text-secondary)] text-sm leading-relaxed mt-2.5">
      {paragraphs.map((p, i) => {
        const trimmed = p.trim();
        if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
          const cleanText = trimmed.replace(/^[-•*]\s*/, "");
          return (
            <div key={i} className="flex items-start gap-2 ml-1">
              <span className="text-[var(--ih-accent)] select-none mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--ih-accent)]" />
              <span>{cleanText}</span>
            </div>
          );
        }
        return <p key={i}>{trimmed}</p>;
      })}
    </div>
  );
}

function WorkMilestone({ exp }: { exp: any }) {
  return (
    <div className="bg-white border border-[var(--ih-border)] hover:border-[var(--ih-border-soft)] transition-colors rounded-xl p-5 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[var(--ih-accent)] to-[var(--ih-accent-2)]" />
      
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-[var(--ih-text-primary)] tracking-tight">
            {exp.position || "Puesto no especificado"}
          </h3>
          
          <div className="flex items-center gap-1.5 mt-1">
            <Building2 className="w-4 h-4 text-[var(--ih-accent)] shrink-0" />
            <span className="text-sm font-semibold text-[var(--ih-accent)]">
              {exp.company}
            </span>
          </div>
        </div>
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--ih-surface-2)] text-[var(--ih-text-secondary)] text-xs font-medium border border-[var(--ih-border)] self-start">
          <Calendar className="w-3.5 h-3.5 text-[var(--ih-text-muted)]" />
          <span>{formatDate(exp.startDate)}</span>
          <span className="text-[var(--ih-text-muted)]">—</span>
          <span>{exp.endDate ? formatDate(exp.endDate) : "Actual"}</span>
        </div>
      </div>

      {exp.description && formatDescription(exp.description)}

      {exp.technologies && exp.technologies.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-[var(--ih-border-soft)]">
          {exp.technologies.map((tech: string, i: number) => (
            <span
              key={i}
              className="px-2.5 py-0.5 rounded-md bg-[var(--ih-accent-soft)] text-[var(--ih-accent)] text-xs font-semibold border border-[var(--ih-accent-soft)]"
            >
              {tech}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function EducationMilestone({ edu }: { edu: any }) {
  return (
    <div className="bg-white border border-[var(--ih-border)] hover:border-[var(--ih-border-soft)] transition-colors rounded-xl p-5 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-400 to-indigo-400" />
      
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-[var(--ih-text-primary)] tracking-tight">
            {edu.degree || "Titulación no especificada"}
          </h3>
          
          {edu.field && edu.field !== edu.degree && (
            <p className="text-sm font-medium text-[var(--ih-text-secondary)] mt-0.5">
              {edu.field}
            </p>
          )}

          <div className="flex items-center gap-1.5 mt-1.5">
            <GraduationCap className="w-4 h-4 text-violet-500 shrink-0" />
            <span className="text-sm font-semibold text-slate-700">
              {edu.institution}
            </span>
          </div>
        </div>
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--ih-surface-2)] text-[var(--ih-text-secondary)] text-xs font-medium border border-[var(--ih-border)] self-start">
          <Calendar className="w-3.5 h-3.5 text-[var(--ih-text-muted)]" />
          <span>{formatDate(edu.startDate)}</span>
          <span className="text-[var(--ih-text-muted)]">—</span>
          <span>{edu.endDate ? formatDate(edu.endDate) : "Actual"}</span>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

function parseJsonField(field: string | string[] | null): string[] {
  if (!field) return []
  if (Array.isArray(field)) return field
  try {
    const parsed = JSON.parse(field as string)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// ─── Formatea una fecha ISO o año suelto ─────────────────────────────────────
function formatDate(date: string | null | undefined): string {
  if (!date) return ''
  // Si es solo un año: "2020-01-01" → "2020"
  if (/^\d{4}-01-01$/.test(date)) return date.slice(0, 4)
  if (/^\d{4}$/.test(date)) return date
  // Si tiene mes significativo
  try {
    const d = new Date(date)
    return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })
  } catch {
    return date.slice(0, 7)
  }
}

// ─── Pipeline config ─────────────────────────────────────────────────────────
const PIPELINE_STEPS = [
  { value: 'NEW',                  label: 'Nuevo',               color: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
  { value: 'IN_REVIEW',           label: 'En revisión',          color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'TECHNICAL_INTERVIEW', label: 'Entrevista técnica',   color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
  { value: 'CULTURAL_INTERVIEW',  label: 'Entrevista cultural',  color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  { value: 'OFFER_SENT',          label: 'Oferta enviada',       color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'HIRED',               label: 'Contratado',           color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'REJECTED',            label: 'Rechazado',            color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { value: 'ARCHIVED',            label: 'Archivado',            color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
]

function getStatusConfig(status: string) {
  return PIPELINE_STEPS.find(s => s.value === status) ?? PIPELINE_STEPS[0]
}

function scoreColor(score: number | null) {
  if (!score) return 'bg-slate-500'
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

function getSeniorityColor(seniority: string | null) {
  switch (seniority) {
    case 'JUNIOR': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    case 'MID':    return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'SENIOR': return 'bg-violet-500/20 text-violet-400 border-violet-500/30'
    case 'LEAD':   return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    default:       return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }
}

// ─── Pipeline Dropdown ────────────────────────────────────────────────────────
function PipelineDropdown({
  status,
  onChange,
}: {
  status: string
  onChange: (newStatus: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = getStatusConfig(status)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = async (value: string) => {
    if (value === status) { setOpen(false); return }
    setSaving(true)
    setOpen(false)
    await onChange(value)
    setSaving(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={saving}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all',
          current.color,
          'hover:opacity-80'
        )}
      >
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
        {current.label}
        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-30 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
          {PIPELINE_STEPS.map(step => (
            <button
              key={step.value}
              onClick={() => handleSelect(step.value)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-800 transition-colors',
                step.value === status && 'bg-slate-800/60'
              )}
            >
              <span className={cn('px-2 py-0.5 rounded-full border', step.color)}>
                {step.label}
              </span>
              {step.value === status && <Check className="w-3 h-3 text-slate-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Notes panel ─────────────────────────────────────────────────────────────
function NotesPanel({ candidateId }: { candidateId: string }) {
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialLoaded = useRef(false)

  useEffect(() => {
    fetch(`/api/candidates/${candidateId}/notes`)
      .then(r => r.json())
      .then(data => {
        if (data.notes?.[0]?.content) {
          setContent(data.notes[0].content)
        }
        initialLoaded.current = true
      })
      .catch(() => { initialLoaded.current = true })
  }, [candidateId])

  const save = useCallback(async (text: string) => {
    if (!text.trim()) return
    setStatus('saving')
    try {
      await fetch(`/api/candidates/${candidateId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('idle')
    }
  }, [candidateId])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setContent(val)
    if (!initialLoaded.current) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setStatus('idle')
    debounceRef.current = setTimeout(() => save(val), 1000)
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--ih-border)] p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--ih-text-primary)] flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-amber-500" />
          Notas del reclutador
        </h3>
        <span className={cn(
          'text-xs font-semibold transition-all duration-300 px-2 py-0.5 rounded-md',
          status === 'saving' ? 'text-slate-600 bg-slate-100 opacity-100' :
          status === 'saved'  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200 opacity-100' : 'opacity-0'
        )}>
          {status === 'saving' ? '⏳ Guardando…' : '✓ Guardado'}
        </span>
      </div>
      <textarea
        value={content}
        onChange={handleChange}
        placeholder="Añade notas sobre este candidato… Se guardan automáticamente."
        rows={6}
        className="w-full bg-[var(--ih-surface-2)] border-2 border-[var(--ih-border)] rounded-xl px-4 py-3 text-sm font-medium text-[var(--ih-text-primary)] placeholder-[var(--ih-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ih-accent)]/20 focus:border-[var(--ih-accent)] resize-none leading-relaxed transition-colors"
      />
      <p className="text-xs text-[var(--ih-text-muted)] mt-1">Las notas se guardan automáticamente.</p>
    </div>
  )
}

// ─── CV Text Renderer — estructura clara y legible ────────────────────────────
function CVTextRenderer({ rawText }: { rawText: string }) {
  const lines = rawText.split(/\n|\r/).filter(l => l.trim().length > 0)

  const SECTION_RE = /^(experiencia|experience|educaci[oó]n|education|formaci[oó]n|habilidades|skills|competencias|idiomas|languages|sobre m[ií]|about|perfil|profile|summary|resumen|contacto|contact|referencias|proyectos|projects)/i
  const HEADER_RE = /^(curriculum|cv\b|resume)/i

  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim()

        // Encabezado principal (nombre, título) — primeras 3 líneas no-vacías
        if (idx < 3 && trimmed.length < 60 && !trimmed.includes('@')) {
          return (
            <p key={idx} className="text-base font-bold text-[var(--ih-text-primary)] py-0.5">
              {trimmed}
            </p>
          )
        }

        // Cabecera de sección
        if (SECTION_RE.test(trimmed) && trimmed.length < 50) {
          return (
            <div key={idx} className="mt-5 mb-2.5">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--ih-accent)] border-b border-[var(--ih-border)] pb-1">
                {trimmed}
              </p>
            </div>
          )
        }

        // Título de CV ignorar
        if (HEADER_RE.test(trimmed)) {
          return null
        }

        // Separadores decorativos
        if (/^[-=_*•·|]{3,}$/.test(trimmed)) {
          return <hr key={idx} className="border-[var(--ih-border-soft)] my-3" />
        }

        // Email / teléfono / linkedin — en gris claro
        if (trimmed.includes('@') || /^(\+?\d[\d\s.\-()]{7,})$/.test(trimmed) || /linkedin\.com/i.test(trimmed)) {
          return (
            <p key={idx} className="text-[var(--ih-text-muted)] text-xs">
              {trimmed}
            </p>
          )
        }

        // Línea que parece fecha o empresa (tiene 4 dígitos de año)
        if (/\b(19|20)\d{2}\b/.test(trimmed) && trimmed.length < 80) {
          return (
            <p key={idx} className="text-[var(--ih-text-muted)] text-xs mt-1">
              {trimmed}
            </p>
          )
        }

        // Línea corta — posible título de cargo o nombre de empresa
        if (trimmed.length < 60 && trimmed.length > 3 && !trimmed.includes(',')) {
          return (
            <p key={idx} className="text-[var(--ih-text-primary)] font-semibold mt-1.5">
              {trimmed}
            </p>
          )
        }

        // Texto normal
        return (
          <p key={idx} className="text-[var(--ih-text-secondary)] mt-1">
            {trimmed}
          </p>
        )
      })}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function CandidateDetail({ candidate }: CandidateDetailProps) {
  const router = useRouter()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'experience' | 'education' | 'skills' | 'cv'>('overview')
  const [candidateData, setCandidateData] = useState(candidate)

  const strengths = parseJsonField(candidateData.strengths)
  const weaknesses = parseJsonField(candidateData.weaknesses)
  const hasAnalysis = candidateData.technicalScore !== null && candidateData.technicalScore !== undefined
  const area = detectArea((candidateData.skills ?? []).map(s => s.name))

  // ── FIX: Prisma devuelve "education" pero el tipo usa "educations" ──────────
  // Normalizamos ambas keys para que siempre tengamos `educations`
  const educations = (candidateData as any).educations ?? (candidateData as any).education ?? []
  const experiences = (candidateData as any).experiences ?? []

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      const response = await fetch(`/api/candidates/${candidate.id}/analyze`, { method: 'POST' })
      const data = await response.json()
      if (data.success && data.analysis) {
        setCandidateData(prev => ({ ...prev, ...data.analysis }))
        setIsGeneratingEmbeddings(true)
        try {
          await fetch('/api/embeddings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidateId: candidate.id }),
          })
        } finally {
          setIsGeneratingEmbeddings(false)
        }
      }
    } catch (err) {
      console.error('Error analizando:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFavorite = async () => {
    const newValue = !candidateData.isFavorite
    setCandidateData(prev => ({ ...prev, isFavorite: newValue }))
    try {
      await fetch(`/api/candidates/${candidate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: newValue }),
      })
    } catch {
      setCandidateData(prev => ({ ...prev, isFavorite: !newValue }))
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    const prev = candidateData.status
    setCandidateData(p => ({ ...p, status: newStatus as Candidate['status'] }))
    try {
      await fetch(`/api/candidates/${candidate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch {
      setCandidateData(p => ({ ...p, status: prev }))
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const tabs = [
    { id: 'overview'   as const, label: 'Overview',    icon: Brain },
    { id: 'experience' as const, label: 'Experiencia', icon: Briefcase },
    { id: 'education'  as const, label: 'Educación',   icon: GraduationCap },
    { id: 'skills'     as const, label: 'Skills',      icon: Code },
    { id: 'cv'         as const, label: 'CV Original', icon: FileText },
  ]

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push('/dashboard/candidates')}
        className="flex items-center gap-2 text-[var(--ih-text-secondary)] hover:text-[var(--ih-text-primary)] transition-colors text-sm font-semibold cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a candidatos
      </button>

      {/* Header card */}
      <div className="bg-white border border-[var(--ih-border)] rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xl font-bold">
            {getInitials(candidateData.name)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[var(--ih-text-primary)]">
                {candidateData.name || 'Sin nombre'}
              </h1>
              {candidateData.seniority && (
                <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium border', getSeniorityColor(candidateData.seniority))}>
                  {candidateData.seniority}
                </span>
              )}
              <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1', getAreaColor(area))}>
                <Tag className="w-3 h-3" />
                {area}
              </span>
              <PipelineDropdown status={candidateData.status} onChange={handleStatusChange} />
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[var(--ih-text-secondary)]">
              {candidateData.email && (
                <a href={`mailto:${candidateData.email}`} className="flex items-center gap-1.5 hover:text-[var(--ih-accent)] transition-colors hover:underline">
                  <Mail className="w-4 h-4 text-[var(--ih-text-muted)]" />{candidateData.email}
                </a>
              )}
              {candidateData.phone && (
                <a href={`tel:${candidateData.phone}`} className="flex items-center gap-1.5 hover:text-[var(--ih-accent)] transition-colors hover:underline">
                  <Phone className="w-4 h-4 text-[var(--ih-text-muted)]" />{candidateData.phone}
                </a>
              )}
              {candidateData.linkedin && (
                <a href={candidateData.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[var(--ih-accent)] transition-colors hover:underline">
                  <ExternalLink className="w-4 h-4 text-[var(--ih-text-muted)]" />LinkedIn
                </a>
              )}
              {candidateData.location && (
                <span className="flex items-center gap-1.5 text-[var(--ih-text-muted)]">
                  <MapPin className="w-4 h-4" />{candidateData.location}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || isGeneratingEmbeddings}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-60 cursor-pointer',
                hasAnalysis
                  ? 'bg-violet-600/10 text-violet-700 hover:bg-violet-600/20 border border-violet-600/20'
                  : 'bg-[var(--ih-accent)] text-white hover:bg-[var(--ih-accent-2)] shadow-sm'
              )}
            >
              {isAnalyzing ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Analizando...</>
              ) : isGeneratingEmbeddings ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Indexando...</>
              ) : hasAnalysis ? (
                <><Sparkles className="w-4 h-4" />Reanalizar</>
              ) : (
                <><Brain className="w-4 h-4" />Analizar con IA</>
              )}
            </button>

            <button
              onClick={handleFavorite}
              className="p-2 rounded-lg hover:bg-[var(--ih-surface-2)] border border-[var(--ih-border)] transition-colors group cursor-pointer"
              title={candidateData.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            >
              <Star className={cn(
                'w-5 h-5 transition-all',
                candidateData.isFavorite
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-[var(--ih-text-muted)] group-hover:text-yellow-400'
              )} />
            </button>
          </div>
        </div>

        {hasAnalysis && (
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-[var(--ih-border-soft)]">
            {[
              { label: 'Score Técnico', value: candidateData.technicalScore },
              { label: 'Score General', value: candidateData.generalScore },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--ih-text-secondary)]">{label}</span>
                  <span className="text-lg font-bold text-[var(--ih-text-primary)]">{value}%</span>
                </div>
                <div className="h-2 bg-[var(--ih-border-soft)] rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', scoreColor(value ?? null))}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1.5 bg-[var(--ih-surface-2)] rounded-lg border border-[var(--ih-border)] overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-all whitespace-nowrap cursor-pointer',
              activeTab === id
                ? 'bg-white text-[var(--ih-accent)] shadow-sm border border-[var(--ih-border-soft)]'
                : 'text-[var(--ih-text-secondary)] hover:text-[var(--ih-text-primary)] hover:bg-white/50'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Grid: content + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {candidateData.summary && (
                <div className="bg-white border border-[var(--ih-border)] rounded-xl p-6 shadow-sm">
                  <h3 className="text-base font-bold text-[var(--ih-text-primary)] mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-violet-500" />Resumen IA
                  </h3>
                  <p className="text-[var(--ih-text-secondary)] text-sm leading-relaxed">{candidateData.summary}</p>
                </div>
              )}

              {strengths.length > 0 && (
                <div className="bg-white border border-[var(--ih-border)] rounded-xl p-6 shadow-sm">
                  <h3 className="text-base font-bold text-[var(--ih-text-primary)] mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />Fortalezas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {strengths.map((s, i) => (
                      <span key={i} className="px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm border border-emerald-100 font-semibold">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {weaknesses.length > 0 && (
                <div className="bg-white border border-[var(--ih-border)] rounded-xl p-6 shadow-sm">
                  <h3 className="text-base font-bold text-[var(--ih-text-primary)] mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />Áreas de mejora
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {weaknesses.map((w, i) => (
                      <span key={i} className="px-3.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-sm border border-amber-100 font-semibold">{w}</span>
                    ))}
                  </div>
                </div>
              )}

              {candidateData.justification && (
                <div className="bg-white border border-[var(--ih-border)] rounded-xl p-6 shadow-sm">
                  <h3 className="text-base font-bold text-[var(--ih-text-primary)] mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />Justificación
                  </h3>
                  <p className="text-[var(--ih-text-secondary)] text-sm leading-relaxed">{candidateData.justification}</p>
                </div>
              )}

              {!hasAnalysis && (
                <div className="bg-white border border-[var(--ih-border)] rounded-xl p-12 text-center shadow-sm">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-[var(--ih-text-muted)] animate-pulse" />
                  <h3 className="text-lg font-bold text-[var(--ih-text-primary)] mb-2">Sin análisis IA</h3>
                  <p className="text-[var(--ih-text-secondary)] text-sm max-w-md mx-auto mb-5">
                    Haz clic en &quot;Analizar con IA&quot; para obtener insights y activar el chat RAG.
                  </p>
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="px-5 py-2.5 bg-[var(--ih-accent)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--ih-accent-2)] disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
                  >
                    {isAnalyzing ? 'Analizando...' : 'Analizar ahora'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* EXPERIENCE */}
          {activeTab === 'experience' && (
            <div className="space-y-4">
              {experiences.length > 0 ? (
                experiences.map((exp: any) => (
                  <WorkMilestone key={exp.id} exp={exp} />
                ))
              ) : (
                <div className="text-center py-16 bg-white border border-[var(--ih-border)] rounded-xl shadow-sm space-y-3">
                  <Briefcase className="w-10 h-10 mx-auto text-[var(--ih-text-muted)]" />
                  <div>
                    <p className="font-bold text-[var(--ih-text-primary)]">No hay experiencia registrada</p>
                    <p className="text-xs mt-1 text-[var(--ih-text-muted)] max-w-xs mx-auto">
                      El parser no detectó experiencias en este CV. Puedes subir de nuevo el archivo tras actualizar el parser.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* EDUCATION */}
          {activeTab === 'education' && (
            <div className="space-y-4">
              {educations.length > 0 ? (
                educations.map((edu: any) => (
                  <EducationMilestone key={edu.id} edu={edu} />
                ))
              ) : (
                <div className="text-center py-16 bg-white border border-[var(--ih-border)] rounded-xl shadow-sm space-y-3">
                  <GraduationCap className="w-10 h-10 mx-auto text-[var(--ih-text-muted)]" />
                  <div>
                    <p className="font-bold text-[var(--ih-text-primary)]">No hay educación registrada</p>
                    <p className="text-xs mt-1 text-[var(--ih-text-muted)] max-w-xs mx-auto">
                      El parser no detectó formación académica en este CV. Sube de nuevo el archivo tras actualizar el parser.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SKILLS */}
          {activeTab === 'skills' && (
            <div className="bg-white border border-[var(--ih-border)] rounded-xl p-6 shadow-sm">
              {candidateData.skills && candidateData.skills.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {candidateData.skills.map(skill => (
                    <div key={skill.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--ih-surface-2)] border border-[var(--ih-border-soft)]">
                      <div>
                        <p className="text-sm font-bold text-[var(--ih-text-primary)]">{skill.name}</p>
                        <p className="text-xs text-[var(--ih-text-muted)] mt-0.5">{skill.category}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className={cn('w-2 h-2 rounded-full', i < skill.level ? 'bg-[var(--ih-accent)]' : 'bg-slate-200')} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-[var(--ih-text-secondary)]">
                  <Code className="w-8 h-8 mx-auto mb-2 text-[var(--ih-text-muted)]" />
                  <p className="font-semibold">No hay skills registradas</p>
                </div>
              )}
            </div>
          )}

          {/* CV ORIGINAL — legible y con estructura */}
          {activeTab === 'cv' && (
            <div className="bg-white border border-[var(--ih-border)] rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[var(--ih-text-primary)] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--ih-text-muted)]" />
                  Texto extraído del CV
                </h3>
              </div>
              {candidateData.resume?.rawText ? (
                <div className="max-h-[700px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  <CVTextRenderer rawText={candidateData.resume.rawText} />
                </div>
              ) : (
                <div className="text-center py-12 text-[var(--ih-text-secondary)]">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-[var(--ih-text-muted)]" />
                  <p className="font-semibold">Texto del CV no disponible</p>
                </div>
              )}
            </div>
          )}

          {/* Notas */}
          <NotesPanel candidateId={candidate.id} />
        </div>

        {/* Sidebar: Chat */}
        <div className="lg:col-span-1">
          <ChatInterface
            candidateId={candidate.id}
            candidateName={candidateData.name || 'el candidato'}
          />
          {!hasAnalysis && (
            <div className="mt-3 flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-[var(--ih-accent-soft)] border border-[var(--ih-accent-soft)] shadow-sm">
              <Brain className="w-4 h-4 text-[var(--ih-accent)] shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-[var(--ih-text-secondary)] leading-snug">
                Analiza el CV con IA para obtener mejores respuestas y activar el chat inteligente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}