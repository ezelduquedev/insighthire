"use client"

import { useState, useEffect } from "react"
import { User, Mail, Phone, Shield, Bell, Save, Loader2, CheckCircle2 } from "lucide-react"

interface ProfileForm { name: string; email: string; phone: string }

interface NotifItem {
  id: string
  label: string
  desc: string
  defaultOn: boolean
}

const NOTIFS: NotifItem[] = [
  { id: "new_candidate", label: "Nuevo candidato subido",   desc: "Cuando se procese un CV nuevo",             defaultOn: true  },
  { id: "ai_done",       label: "Análisis IA completado",   desc: "Al finalizar el análisis de un perfil",     defaultOn: true  },
  { id: "high_match",    label: "Match superior al 80%",    desc: "Cuando un candidato supere el umbral",      defaultOn: false },
  { id: "weekly",        label: "Resumen semanal",          desc: "Estadísticas de la semana cada lunes",      defaultOn: false },
]

function Toggle({ defaultChecked }: { defaultChecked: boolean }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <button
      type="button"
      onClick={() => setOn(v => !v)}
      className={`ih-toggle ${on ? "on" : ""}`}
      aria-label="Alternar ajuste"
    />
  )
}

export default function SettingsPage() {
  const [form, setForm] = useState<ProfileForm>({ name: "", email: "", phone: "" })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications'>('profile')

  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(data => {
        if (data?.user) setForm({ name: data.user.name ?? "", email: data.user.email ?? "", phone: "" })
      })
      .catch(() => {})
  }, [])

  async function handleSave() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const tabs = [
    { id: "profile" as const, label: "Perfil", icon: User },
    { id: "notifications" as const, label: "Notificaciones", icon: Bell },
  ]

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="ih-page-title">Ajustes</h1>
        <p className="ih-page-subtitle">Gestiona tu perfil y preferencias.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "var(--ih-surface-2)", border: "1px solid var(--ih-border)" }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`ih-tab ${activeTab === tab.id ? "active" : ""}`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          <div className="ih-card space-y-5">
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--ih-text-primary)" }}>
              <User className="h-4 w-4" style={{ color: "var(--ih-accent)" }} />
              Información personal
            </h2>

            {/* Avatar row */}
            <div className="flex items-center gap-4 pb-4" style={{ borderBottom: "1px solid var(--ih-border)" }}>
              <div className="ih-avatar" style={{ width: "3.5rem", height: "3.5rem", fontSize: "1.25rem" }}>
                {(form.name || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold" style={{ color: "var(--ih-text-primary)" }}>{form.name || "Usuario"}</p>
                <p className="text-sm" style={{ color: "var(--ih-text-muted)" }}>{form.email}</p>
                <span className="ih-badge ih-badge-indigo mt-1" style={{ fontSize: ".7rem" }}>
                  <Shield className="h-3 w-3 mr-1" />Reclutador
                </span>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--ih-text-secondary)" }}>
                  Nombre completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--ih-text-muted)" }} />
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="ih-input"
                    style={{ paddingLeft: "2.25rem" }}
                    placeholder="Tu nombre"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--ih-text-secondary)" }}>
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--ih-text-muted)" }} />
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className="ih-input opacity-60"
                    style={{ paddingLeft: "2.25rem" }}
                  />
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--ih-text-muted)" }}>El email no se puede cambiar.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--ih-text-secondary)" }}>
                  Teléfono <span style={{ fontWeight: 400, color: "var(--ih-text-muted)" }}>(opcional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--ih-text-muted)" }} />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="ih-input"
                    style={{ paddingLeft: "2.25rem" }}
                    placeholder="+34 600 000 000"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="ih-btn ih-btn-primary min-w-[140px]"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</>
              ) : saved ? (
                <><CheckCircle2 className="h-4 w-4" /> Guardado</>
              ) : (
                <><Save className="h-4 w-4" /> Guardar cambios</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Notifications tab */}
      {activeTab === 'notifications' && (
        <div className="ih-card space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--ih-text-primary)" }}>
            <Bell className="h-4 w-4" style={{ color: "var(--ih-accent)" }} />
            Preferencias de notificación
          </h2>
          <div className="divide-y divide-[var(--ih-border-soft)]">
            {NOTIFS.map(n => (
              <div key={n.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium" style={{ color: "var(--ih-text-primary)" }}>{n.label}</p>
                  <p className="text-xs" style={{ color: "var(--ih-text-muted)" }}>{n.desc}</p>
                </div>
                <Toggle defaultChecked={n.defaultOn} />
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs" style={{ color: "var(--ih-text-muted)" }}>
        InsightHire v1.0.0 — DAM 2026
      </p>
    </div>
  )
}