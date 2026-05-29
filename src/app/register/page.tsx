"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Loader2, Mail, Lock, User, Zap, ArrowRight, CheckCircle } from "lucide-react"

const perks = [
  "Análisis automático de CVs con IA",
  "Chat RAG contextualizado por candidato",
  "Dashboard con métricas en tiempo real",
  "Sistema de matching candidato-oferta",
]

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ name: "", email: "", password: "" })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || "Error al crear la cuenta")
      setIsLoading(false)
    } else {
      router.push("/login?registered=true")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] bg-violet-600 p-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center p-1.5 shrink-0">
            <img src="/favicon-shield.png" alt="Logo" className="w-5 h-5 object-contain [filter:brightness(0)_invert(1)]" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">InsightHire</span>
        </div>

        <div>
          <h2 className="text-white text-2xl font-extrabold mb-6 leading-snug tracking-tight">
            Todo lo que necesitas para contratar mejor
          </h2>
          <div className="space-y-3">
            {perks.map((p) => (
              <div key={p} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-violet-200 shrink-0 mt-0.5" />
                <p className="text-violet-100 text-sm leading-relaxed">{p}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl p-6">
          <p className="text-white/80 text-sm leading-relaxed italic mb-4">
            &ldquo;En menos de 5 minutos subimos 20 CVs, los analizamos con IA y tuvimos
            un ranking de candidatos. Impresionante.&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Alejandro R.</p>
              <p className="text-violet-200 text-xs">CTO, Startup SaaS</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: form ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center p-1.5 shrink-0">
              <img src="/favicon-shield.png" alt="Logo" className="w-5 h-5 object-contain [filter:brightness(0)_invert(1)]" />
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">InsightHire</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">
              Crea tu cuenta
            </h1>
            <p className="text-gray-500 text-sm">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-violet-600 font-semibold hover:text-violet-700">
                Inicia sesión
              </Link>
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nombre completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Tu nombre"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="tu@email.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-all text-sm shadow-lg shadow-violet-200 mt-2"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Creando cuenta…</>
              ) : (
                <>Crear Cuenta <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            InsightHire v1.0 — DAM 2026
          </p>
        </motion.div>
      </div>
    </div>
  )
}