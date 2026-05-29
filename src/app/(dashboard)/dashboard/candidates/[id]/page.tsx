// Ruta destino: src/app/(dashboard)/dashboard/candidates/[id]/page.tsx
// REEMPLAZA el archivo actual en esa carpeta
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CandidateDetail } from '@/components/candidate-detail/CandidateDetail'
import { Candidate } from '@/types'

export default function CandidateDetailPage() {
  const { id } = useParams()
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/candidates/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.candidate) {
          setCandidate(data.candidate)
        } else {
          setError(true)
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-32 bg-slate-800 rounded-lg" />
          <div className="h-40 bg-slate-900/50 rounded-xl border border-slate-800" />
          <div className="h-12 bg-slate-900/50 rounded-lg border border-slate-800" />
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 h-64 bg-slate-900/50 rounded-xl border border-slate-800" />
            <div className="h-64 bg-slate-900/50 rounded-xl border border-slate-800" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !candidate) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-slate-400">Candidato no encontrado</p>
        <a
          href="/dashboard/candidates"
          className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg text-sm hover:bg-slate-700 transition-colors"
        >
          Volver a candidatos
        </a>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <CandidateDetail candidate={candidate} />
    </div>
  )
}
