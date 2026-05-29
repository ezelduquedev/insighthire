"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ email: "", password: "" })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")
    const result = await signIn("credentials", { email: form.email, password: form.password, redirect: false })
    setLoading(false)
    if (result?.error) {
      setError("Credenciales incorrectas. Intenta de nuevo.")
    } else {
      router.push("/dashboard"); router.refresh()
    }
  }

  return (
    <div className="ih-auth-page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }}>
        <div className="ih-auth-card">
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <div style={{ display: "inline-flex", marginBottom: ".875rem" }}>
              <img
                src="/favicon-shield.png"
                alt="InsightHire Logo"
                style={{
                  width: "2.75rem",
                  height: "2.75rem",
                  borderRadius: ".875rem",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  objectFit: "contain"
                }}
              />
            </div>
            <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--ih-text-primary)", marginBottom: ".25rem" }}>
              Bienvenido de vuelta
            </h1>
            <p style={{ fontSize: ".875rem", color: "var(--ih-text-muted)" }}>
              Accede a tu cuenta de InsightHire
            </p>
          </div>

          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: ".5rem",
              background: "#FEF2F2", border: "1px solid #FECACA",
              borderRadius: ".5rem", padding: ".75rem 1rem",
              marginBottom: "1.25rem", color: "#DC2626", fontSize: ".875rem",
            }}>
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: ".8125rem", fontWeight: 600, color: "var(--ih-text-secondary)", marginBottom: ".5rem" }}>
                Email
              </label>
              <div style={{ position: "relative" }}>
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--ih-text-muted)" }} />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="ih-input"
                  style={{ paddingLeft: "2.25rem" }}
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".5rem" }}>
              <label style={{ display: "block", fontSize: ".8125rem", fontWeight: 600, color: "var(--ih-text-secondary)" }}>
                Contraseña
              </label>
              <Link href="/forgot-password" style={{ fontSize: ".8125rem", color: "var(--ih-accent)", fontWeight: 500, textDecoration: "none" }} className="hover:underline">
                ¿Olvidé mi contraseña?
              </Link>
            </div>
            <div style={{ position: "relative" }}>
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--ih-text-muted)" }} />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="ih-input"
                style={{ paddingLeft: "2.25rem" }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="ih-btn ih-btn-primary"
              style={{ width: "100%", marginTop: ".25rem", justifyContent: "center" }}
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Iniciando…</> : "Iniciar Sesión"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: ".875rem", color: "var(--ih-text-muted)" }}>
            ¿No tienes cuenta?{" "}
            <Link href="/register" style={{ color: "var(--ih-accent)", fontWeight: 500, textDecoration: "none" }}>
              Regístrate
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}