"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Zap, MessageSquare, BarChart3, Shield, CheckCircle } from "lucide-react"

const features = [
  { icon: Zap,           title: "Parsing Inteligente",  desc: "Extrae automáticamente datos de CVs en PDF y DOCX con IA avanzada." },
  { icon: MessageSquare, title: "Chat RAG",             desc: "Haz preguntas sobre candidatos y obtén respuestas contextualizadas." },
  { icon: BarChart3,     title: "Matching Automático",  desc: "Compara candidatos con ofertas usando algoritmos inteligentes." },
  { icon: Shield,        title: "Seguro y Escalable",   desc: "Arquitectura moderna con Next.js 15, PostgreSQL y autenticación JWT." },
]

const steps = [
  { n: "01", title: "Sube el CV", desc: "Arrastra un PDF o DOCX. InsightHire extrae los datos automáticamente." },
  { n: "02", title: "Analiza con IA", desc: "El sistema puntúa seniority, fortalezas y debilidades en segundos." },
  { n: "03", title: "Encuentra el match", desc: "Cruza candidatos con tus ofertas y obtén un ranking de compatibilidad." },
]

export default function LandingPage() {
  return (
    <div style={{ background: "#F1F3F7", minHeight: "100vh", color: "var(--ih-text-primary, #1A2035)" }}>

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #E2E5EB",
        padding: "0 2rem", height: "3.75rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
          <img
            src="/favicon-shield.png"
            alt="Logo"
            style={{
              width: "2rem",
              height: "2rem",
              borderRadius: ".5rem",
              flexShrink: 0,
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
              objectFit: "contain"
            }}
          />
          <span style={{ fontWeight: 700, fontSize: "1rem", color: "#1A2035" }}>
            Insight<span style={{ color: "#4F62D0" }}>Hire</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: ".75rem", alignItems: "center" }}>
          <Link href="/login" style={{ fontSize: ".875rem", color: "#4B5568", textDecoration: "none", padding: ".5rem .875rem" }}>
            Iniciar sesión
          </Link>
          <Link href="/register" style={{
            fontSize: ".875rem", fontWeight: 500, color: "#fff", textDecoration: "none",
            background: "#4F62D0", padding: ".5rem 1.125rem", borderRadius: ".5rem",
            transition: "background .15s",
          }}>
            Comenzar gratis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "5rem 2rem 4rem", maxWidth: "72rem", margin: "0 auto", textAlign: "center" }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: ".5rem",
            padding: ".3rem 1rem", borderRadius: "9999px",
            background: "#EEF0FB", border: "1px solid #C7CDFB",
            color: "#4F62D0", fontSize: ".8125rem", fontWeight: 500,
            marginBottom: "1.75rem",
          }}>
            <Zap style={{ width: "1rem", height: "1rem" }} />
            Reclutamiento potenciado por IA
          </div>

          <h1 style={{
            fontSize: "clamp(2.25rem, 6vw, 4rem)",
            fontWeight: 800, lineHeight: 1.15,
            color: "#1A2035", marginBottom: "1.25rem",
          }}>
            Encuentra el talento{" "}
            <span style={{ color: "#4F62D0" }}>perfecto</span>
            <br />más rápido que nunca
          </h1>

          <p style={{
            fontSize: "1.125rem", color: "#4B5568",
            maxWidth: "34rem", margin: "0 auto 2.25rem",
            lineHeight: 1.7,
          }}>
            InsightHire analiza CVs automáticamente, genera embeddings vectoriales
            y permite hacer preguntas sobre candidatos en lenguaje natural.
          </p>

          <div style={{ display: "flex", gap: ".875rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{
              display: "inline-flex", alignItems: "center", gap: ".5rem",
              background: "#4F62D0", color: "#fff", textDecoration: "none",
              padding: ".75rem 1.75rem", borderRadius: ".625rem",
              fontWeight: 600, fontSize: ".9375rem",
            }}>
              Comenzar Ahora <ArrowRight style={{ width: "1.1rem", height: "1.1rem" }} />
            </Link>
            <Link href="/login" style={{
              display: "inline-flex", alignItems: "center",
              background: "#fff", color: "#4B5568", textDecoration: "none",
              padding: ".75rem 1.75rem", borderRadius: ".625rem",
              fontWeight: 500, fontSize: ".9375rem",
              border: "1px solid #E2E5EB",
            }}>
              Iniciar Sesión
            </Link>
          </div>
        </motion.div>

        {/* Mock dashboard card */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .35, duration: .8 }}
          style={{
            marginTop: "3.5rem",
            background: "#fff",
            border: "1px solid #E2E5EB",
            borderRadius: "1rem",
            padding: "1.5rem",
            boxShadow: "0 16px 48px rgba(0,0,0,.07)",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {[
              { label: "Total Candidatos", value: "142", color: "#EFF6FF", icon: "👥" },
              { label: "Score Medio",      value: "78%",  color: "#ECFDF5", icon: "🎯" },
              { label: "Ofertas Activas",  value: "8",    color: "#F5F3FF", icon: "📋" },
              { label: "Matches Hoy",      value: "23",   color: "#FFF7ED", icon: "✅" },
            ].map(card => (
              <div key={card.label} style={{
                flex: "1 1 10rem",
                background: card.color,
                borderRadius: ".75rem",
                padding: "1rem",
              }}>
                <p style={{ fontSize: ".75rem", color: "#8C95A6", marginBottom: ".25rem" }}>{card.icon} {card.label}</p>
                <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1A2035" }}>{card.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section style={{ padding: "4rem 2rem", borderTop: "1px solid #E2E5EB", background: "#fff" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#1A2035", marginBottom: ".75rem" }}>
              ¿Por qué InsightHire?
            </h2>
            <p style={{ color: "#4B5568" }}>Tecnología de vanguardia para tu equipo de RRHH</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))", gap: "1.25rem" }}>
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  style={{
                    background: "#F8F9FB",
                    border: "1px solid #E2E5EB",
                    borderRadius: ".875rem",
                    padding: "1.5rem",
                  }}
                >
                  <div style={{
                    width: "2.75rem", height: "2.75rem", borderRadius: ".625rem",
                    background: "#EEF0FB",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: "1rem",
                  }}>
                    <Icon style={{ width: "1.375rem", height: "1.375rem", color: "#4F62D0" }} />
                  </div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#1A2035", marginBottom: ".375rem" }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: ".875rem", color: "#4B5568", lineHeight: 1.6 }}>{f.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "4rem 2rem", borderTop: "1px solid #E2E5EB" }}>
        <div style={{ maxWidth: "54rem", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#1A2035", marginBottom: ".75rem" }}>
              Cómo funciona
            </h2>
            <p style={{ color: "#4B5568" }}>Tres pasos, resultados en segundos</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "1.25rem",
                  background: "#fff",
                  border: "1px solid #E2E5EB",
                  borderRadius: ".875rem",
                  padding: "1.25rem 1.5rem",
                }}
              >
                <div style={{
                  width: "2.75rem", height: "2.75rem", borderRadius: ".625rem", flexShrink: 0,
                  background: "#EEF0FB",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: ".875rem", color: "#4F62D0",
                }}>
                  {s.n}
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: "#1A2035", marginBottom: ".25rem" }}>{s.title}</p>
                  <p style={{ fontSize: ".875rem", color: "#4B5568" }}>{s.desc}</p>
                </div>
                <CheckCircle style={{ marginLeft: "auto", width: "1.25rem", height: "1.25rem", color: "#10B981", flexShrink: 0 }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "4rem 2rem", borderTop: "1px solid #E2E5EB", background: "#fff" }}>
        <div style={{ maxWidth: "38rem", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1A2035", marginBottom: ".875rem" }}>
            Listo para empezar
          </h2>
          <p style={{ color: "#4B5568", marginBottom: "2rem" }}>
            Únete a InsightHire y moderniza tu proceso de selección.
          </p>
          <Link href="/register" style={{
            display: "inline-flex", alignItems: "center", gap: ".5rem",
            background: "#4F62D0", color: "#fff", textDecoration: "none",
            padding: ".875rem 2rem", borderRadius: ".625rem",
            fontWeight: 600, fontSize: "1rem",
          }}>
            Crear cuenta gratis <ArrowRight style={{ width: "1.1rem", height: "1.1rem" }} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: "1.5rem 2rem",
        borderTop: "1px solid #E2E5EB",
        textAlign: "center",
        fontSize: ".8125rem",
        color: "#8C95A6",
      }}>
        © 2026 InsightHire — Proyecto Fin de Ciclo DAM · Ezel Alexander Duque Arias
      </footer>
    </div>
  )
}