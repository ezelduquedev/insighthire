// src/app/(dashboard)/dashboard/matches/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { JobOffer } from '@/types'
import {
  Briefcase,
  Zap,
  ChevronDown,
  User,
  Star,
  Code2,
  Clock,
  TrendingUp,
  Loader2,
  AlertCircle,
  Trophy,
  Target,
} from 'lucide-react'

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

interface MatchResult {
  candidateId: string
  jobOfferId: string
  score: number
  skillMatch: number
  experienceMatch: number
  seniorityMatch: number
  explanation: string
  candidate?: {
    id: string
    name: string | null
    email: string | null
    seniority: string | null
    technicalScore: number | null
    generalScore: number | null
    skills: Array<{ name: string }>
  }
}

function ScoreBar({ value, label, color }: { value: number; label: string; color: string }) {
  const pct = Math.round(value * 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-medium text-slate-200">{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function getScoreColor(score: number): string {
  if (score >= 0.8) return 'text-emerald-400'
  if (score >= 0.55) return 'text-amber-400'
  return 'text-red-400'
}

function getScoreBg(score: number): string {
  if (score >= 0.8) return 'bg-emerald-500/10 border-emerald-500/30'
  if (score >= 0.55) return 'bg-amber-500/10 border-amber-500/30'
  return 'bg-red-500/10 border-red-500/30'
}

function getRankIcon(index: number) {
  if (index === 0) return <Trophy className="w-4 h-4 text-amber-400" />
  if (index === 1) return <Trophy className="w-4 h-4 text-slate-400" />
  if (index === 2) return <Trophy className="w-4 h-4 text-amber-700" />
  return <span className="text-slate-500 text-sm font-mono w-4 text-center">#{index + 1}</span>
}

function getSeniorityColor(seniority: string | null) {
  switch (seniority) {
    case 'JUNIOR': return 'bg-emerald-500/20 text-emerald-400'
    case 'MID': return 'bg-blue-500/20 text-blue-400'
    case 'SENIOR': return 'bg-violet-500/20 text-violet-400'
    case 'LEAD': return 'bg-amber-500/20 text-amber-400'
    default: return 'bg-slate-500/20 text-slate-400'
  }
}

export default function MatchesPage() {
  const [offers, setOffers] = useState<JobOffer[]>([])
  const [selectedOffer, setSelectedOffer] = useState<JobOffer | null>(null)
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [isLoadingOffers, setIsLoadingOffers] = useState(true)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [filterMin, setFilterMin] = useState(0)

  useEffect(() => {
    fetch('/api/offers')
      .then(r => r.json())
      .then(data => {
        if (data.success) setOffers(data.offers)
      })
      .finally(() => setIsLoadingOffers(false))
  }, [])

  const calculateMatches = useCallback(async (offer: JobOffer) => {
    setIsCalculating(true)
    setMatches([])
    try {
      // 1. Calcular matches en backend
      const res = await fetch(`/api/offers/${offer.id}/match`, { method: 'POST' })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      // 2. Cargar candidatos con detalle para mostrar info
      const candidatesRes = await fetch('/api/candidates?limit=100')
      const candidatesData = await candidatesRes.json()
      const candidatesMap: Record<string, any> = {}
      if (candidatesData.candidates) {
        for (const c of candidatesData.candidates) {
          candidatesMap[c.id] = c
        }
      }

      // 3. Enriquecer matches con datos del candidato
      const enriched: MatchResult[] = (data.matches ?? []).map((m: MatchResult) => ({
        ...m,
        candidate: candidatesMap[m.candidateId] ?? null,
      }))

      setMatches(enriched)
    } catch (err) {
      console.error('Error calculando matches:', err)
    } finally {
      setIsCalculating(false)
    }
  }, [])

  const handleSelectOffer = (offer: JobOffer) => {
    setSelectedOffer(offer)
    setIsDropdownOpen(false)
    calculateMatches(offer)
  }

  const filtered = matches.filter(m => m.score >= filterMin / 100)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Matches</h1>
        <p className="text-slate-400 text-sm mt-1">
          Selecciona una oferta para ver el ranking de compatibilidad con tus candidatos
        </p>
      </div>

      {/* Selector de oferta */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(v => !v)}
          disabled={isLoadingOffers}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-left hover:border-slate-600 transition-colors disabled:opacity-50"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
            {isLoadingOffers ? (
              <span className="text-slate-500 text-sm">Cargando ofertas…</span>
            ) : selectedOffer ? (
              <div className="min-w-0">
                <p className="text-slate-100 text-sm font-medium truncate">{selectedOffer.title}</p>
                <p className="text-slate-400 text-xs">{selectedOffer.company}</p>
              </div>
            ) : (
              <span className="text-slate-400 text-sm">
                {offers.length === 0 ? 'No hay ofertas creadas aún' : 'Selecciona una oferta…'}
              </span>
            )}
          </div>
          <ChevronDown className={cn('w-4 h-4 text-slate-400 shrink-0 transition-transform', isDropdownOpen && 'rotate-180')} />
        </button>

        {isDropdownOpen && offers.length > 0 && (
          <div className="absolute z-20 top-full mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
            {offers.map(offer => (
              <button
                key={offer.id}
                onClick={() => handleSelectOffer(offer)}
                className={cn(
                  'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-800 transition-colors',
                  selectedOffer?.id === offer.id && 'bg-slate-800/60'
                )}
              >
                <Briefcase className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-slate-100 text-sm font-medium truncate">{offer.title}</p>
                  <p className="text-slate-400 text-xs">{offer.company} · {offer.seniority ?? 'Sin nivel'}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filtro mínimo score */}
      {matches.length > 0 && (
        <div className="flex items-center gap-4 px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl">
          <Target className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-slate-400 text-sm shrink-0">Score mínimo: <span className="text-slate-200 font-medium">{filterMin}%</span></span>
          <input
            type="range"
            min={0}
            max={90}
            step={5}
            value={filterMin}
            onChange={e => setFilterMin(Number(e.target.value))}
            className="flex-1 accent-violet-500"
          />
          <span className="text-slate-500 text-xs shrink-0">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Estado de carga */}
      {isCalculating && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          <p className="text-slate-400 text-sm">Calculando compatibilidad con todos los candidatos…</p>
        </div>
      )}

      {/* Sin oferta seleccionada */}
      {!selectedOffer && !isCalculating && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
          <Zap className="w-10 h-10 text-slate-700" />
          <p className="text-sm">Selecciona una oferta para ver el ranking</p>
        </div>
      )}

      {/* Sin resultados después de filtro */}
      {!isCalculating && selectedOffer && matches.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
          <AlertCircle className="w-8 h-8 text-slate-700" />
          <p className="text-sm">Ningún candidato supera el {filterMin}% de compatibilidad</p>
        </div>
      )}

      {/* Lista de matches */}
      {!isCalculating && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((match, index) => {
            const pct = Math.round(match.score * 100)
            const name = match.candidate?.name ?? 'Sin nombre'
            const initials = name === 'Sin nombre' ? '?' : name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

            return (
              <div
                key={match.candidateId}
                className={cn(
                  'p-4 rounded-xl border transition-all',
                  getScoreBg(match.score)
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Rank */}
                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    {getRankIcon(index)}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {initials}
                  </div>

                  {/* Info candidato */}
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <a
                          href={`/dashboard/candidates/${match.candidateId}`}
                          className="text-slate-100 font-semibold hover:text-violet-400 transition-colors truncate block"
                        >
                          {name}
                        </a>
                        {match.candidate?.email && (
                          <p className="text-slate-400 text-xs truncate">{match.candidate.email}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {match.candidate?.seniority && (
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', getSeniorityColor(match.candidate.seniority))}>
                            {match.candidate.seniority}
                          </span>
                        )}
                        <div className={cn('text-xl font-bold tabular-nums', getScoreColor(match.score))}>
                          {pct}%
                        </div>
                      </div>
                    </div>

                    {/* Barras de scores */}
                    <div className="grid grid-cols-3 gap-3">
                      <ScoreBar value={match.skillMatch} label="Skills" color="bg-violet-500" />
                      <ScoreBar value={match.seniorityMatch} label="Seniority" color="bg-blue-500" />
                      <ScoreBar value={match.experienceMatch} label="Experiencia" color="bg-emerald-500" />
                    </div>

                    {/* Explicación */}
                    {match.explanation && (
                      <p className="text-xs text-slate-400 leading-relaxed">{match.explanation}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}