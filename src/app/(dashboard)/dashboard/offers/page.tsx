// Ruta destino: src/app/(dashboard)/dashboard/offers/page.tsx
// Crear carpeta: src/app/(dashboard)/dashboard/offers/
'use client'

import { useState, useEffect, useRef } from 'react'
import { JobOffer } from '@/types'
import {
  Plus,
  Search,
  Building2,
  MapPin,
  Globe,
  Briefcase,
  Pencil,
  Trash2,
  X,
  Loader2,
  ChevronDown,
} from 'lucide-react'

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

const SENIORITY_OPTIONS = ['JUNIOR', 'MID', 'SENIOR', 'LEAD'] as const
type Seniority = typeof SENIORITY_OPTIONS[number]

const getSeniorityColor = (seniority: string | null) => {
  switch (seniority) {
    case 'JUNIOR': return 'bg-emerald-500/20 text-emerald-400'
    case 'MID': return 'bg-blue-500/20 text-blue-400'
    case 'SENIOR': return 'bg-violet-500/20 text-violet-400'
    case 'LEAD': return 'bg-amber-500/20 text-amber-400'
    default: return 'bg-slate-500/20 text-slate-400'
  }
}

const emptyForm = {
  title: '',
  company: '',
  description: '',
  requirements: '',
  seniority: 'MID' as Seniority,
  location: '',
  isRemote: false,
  skills: [] as string[],
  skillInput: '',
}

export default function OffersPage() {
  const [offers, setOffers] = useState<JobOffer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSeniority, setFilterSeniority] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOffer, setEditingOffer] = useState<JobOffer | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const skillInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadOffers()
  }, [])

  const loadOffers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/offers')
      const data = await response.json()
      if (data.success) {
        setOffers(data.offers)
      }
    } catch (error) {
      console.error('Error cargando ofertas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const url = editingOffer ? `/api/offers/${editingOffer.id}` : '/api/offers'
      const method = editingOffer ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          company: formData.company,
          description: formData.description,
          requirements: formData.requirements || undefined,
          seniority: formData.seniority,
          location: formData.location || undefined,
          isRemote: formData.isRemote,
          skills: formData.skills,
        }),
      })
      if (response.ok) {
        await loadOffers()
        closeModal()
      }
    } catch (error) {
      console.error('Error guardando oferta:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta oferta?')) return
    try {
      const response = await fetch(`/api/offers/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setOffers(prev => prev.filter(o => o.id !== id))
      }
    } catch (error) {
      console.error('Error eliminando oferta:', error)
    }
  }

  const openModal = (offer?: JobOffer) => {
    if (offer) {
      setEditingOffer(offer)
      setFormData({
        title: offer.title,
        company: offer.company,
        description: offer.description,
        requirements: offer.requirements || '',
        seniority: (offer.seniority as Seniority) || 'MID',
        location: offer.location || '',
        isRemote: offer.isRemote,
        skills: offer.skills,
        skillInput: '',
      })
    } else {
      setEditingOffer(null)
      setFormData(emptyForm)
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingOffer(null)
    setFormData(emptyForm)
  }

  const addSkill = () => {
    const skill = formData.skillInput.trim()
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, skill], skillInput: '' }))
    }
    skillInputRef.current?.focus()
  }

  const removeSkill = (skill: string) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))
  }

  const filteredOffers = offers.filter(offer => {
    const q = search.toLowerCase()
    const matchesSearch = !search ||
      offer.title.toLowerCase().includes(q) ||
      offer.company.toLowerCase().includes(q) ||
      offer.description.toLowerCase().includes(q)
    const matchesSeniority = !filterSeniority || offer.seniority === filterSeniority
    return matchesSearch && matchesSeniority
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Ofertas Laborales</h1>
          <p className="text-slate-400 text-sm mt-1">
            {offers.length} oferta{offers.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="ih-btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium hover:bg-ih-accent-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Oferta
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar ofertas..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>
        <div className="relative">
          <select
            value={filterSeniority}
            onChange={e => setFilterSeniority(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer"
          >
            <option value="">Todas las seniorities</option>
            {SENIORITY_OPTIONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="text-center py-24">
          <Briefcase className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-400">
            {search || filterSeniority ? 'No hay resultados' : 'No hay ofertas'}
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            {search || filterSeniority ? 'Prueba con otros filtros' : 'Crea tu primera oferta laboral'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOffers.map(offer => (
            <div
              key={offer.id}
              className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 hover:border-slate-700 transition-colors flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-violet-600/20 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-100 text-sm truncate">{offer.title}</h3>
                    <p className="text-xs text-slate-400 truncate">{offer.company}</p>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0 ml-2">
                  <button
                    onClick={() => openModal(offer)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(offer.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-slate-400 mb-3 line-clamp-2 flex-1">{offer.description}</p>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                {offer.seniority && (
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getSeniorityColor(offer.seniority))}>
                    {offer.seniority}
                  </span>
                )}
                {offer.isRemote && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                    <Globe className="w-3 h-3" />
                    Remoto
                  </span>
                )}
                {offer.location && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
                    <MapPin className="w-3 h-3" />
                    {offer.location}
                  </span>
                )}
              </div>

              {offer.skills && offer.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {offer.skills.slice(0, 5).map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-xs">
                      {skill}
                    </span>
                  ))}
                  {offer.skills.length > 5 && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-500 text-xs">
                      +{offer.skills.length - 5}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-auto pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {offer._count?.matches ?? 0} matches
                </span>
                <span className={cn('text-xs', offer.isActive ? 'text-emerald-400' : 'text-slate-500')}>
                  {offer.isActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-slate-100">
                {editingOffer ? 'Editar Oferta' : 'Nueva Oferta'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Título *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  placeholder="ej. Frontend Developer"
                />
              </div>

              {/* Empresa */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Empresa *</label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={e => setFormData(p => ({ ...p, company: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  placeholder="ej. TechCorp"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Descripción *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                  placeholder="Descripción del puesto..."
                />
              </div>

              {/* Requisitos */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Requisitos</label>
                <textarea
                  rows={2}
                  value={formData.requirements}
                  onChange={e => setFormData(p => ({ ...p, requirements: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                  placeholder="Requisitos técnicos..."
                />
              </div>

              {/* Seniority + Ubicación */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Seniority</label>
                  <select
                    value={formData.seniority}
                    onChange={e => setFormData(p => ({ ...p, seniority: e.target.value as Seniority }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  >
                    {SENIORITY_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Ubicación</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    placeholder="ej. Madrid, España"
                  />
                </div>
              </div>

              {/* Remoto */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isRemote}
                  onChange={e => setFormData(p => ({ ...p, isRemote: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-violet-600 focus:ring-violet-500/50"
                />
                <span className="text-sm text-slate-300">Trabajo remoto</span>
              </label>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Skills requeridos</label>
                <div className="flex gap-2 mb-2">
                  <input
                    ref={skillInputRef}
                    type="text"
                    value={formData.skillInput}
                    onChange={e => setFormData(p => ({ ...p, skillInput: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    placeholder="ej. React, TypeScript..."
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    Añadir
                  </button>
                </div>
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {formData.skills.map(skill => (
                      <span
                        key={skill}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-violet-500/20 text-violet-400 text-xs"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="hover:text-violet-200 ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-500 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                  ) : (
                    editingOffer ? 'Guardar cambios' : 'Crear oferta'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
