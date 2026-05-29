"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, Search, X, Check, Info, AlertTriangle, Sparkles, CheckCheck } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Notification {
  id: string
  title: string
  description: string
  time: string
  unread: boolean
  category: "SUCCESS" | "INFO" | "WARNING" | "MATCH"
}

export function DashboardHeader({ user }: { user: any }) {
  const [query, setQuery] = useState("")
  const [showNotifications, setShowNotifications] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "¡CV Procesado con éxito!",
      description: "Ezel Alexander Duque Arias se ha importado correctamente como JUNIOR.",
      time: "Hace unos instantes",
      unread: true,
      category: "SUCCESS",
    },
    {
      id: "2",
      title: "Nueva oferta añadida",
      description: "Se ha publicado la vacante de Desarrollador Full-Stack.",
      time: "Hace 2 horas",
      unread: true,
      category: "INFO",
    },
    {
      id: "3",
      title: "¡Gran Match detectado!",
      description: "Un candidato tiene 92% de afinidad con la oferta de React Frontend.",
      time: "Hace 5 horas",
      unread: false,
      category: "MATCH",
    },
  ])

  // Cerrar el panel al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    router.push(`/dashboard/candidates?search=${encodeURIComponent(q)}`)
  }

  const unreadCount = notifications.filter((n) => n.unread).length

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  function toggleUnread(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n))
    )
  }

  function getCategoryIcon(category: string) {
    switch (category) {
      case "SUCCESS":
        return (
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: "2rem", height: "2rem", background: "#ECFDF5", color: "var(--ih-success)" }}
          >
            <Check className="h-4 w-4" />
          </div>
        )
      case "WARNING":
        return (
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: "2rem", height: "2rem", background: "#FFFBEB", color: "var(--ih-warning)" }}
          >
            <AlertTriangle className="h-4 w-4" />
          </div>
        )
      case "MATCH":
        return (
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: "2rem", height: "2rem", background: "#EEF2FF", color: "#6366F1" }}
          >
            <Sparkles className="h-4 w-4" />
          </div>
        )
      default:
        return (
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: "2rem", height: "2rem", background: "#EFF6FF", color: "#3B82F6" }}
          >
            <Info className="h-4 w-4" />
          </div>
        )
    }
  }

  return (
    <header className="ih-header relative">
      <form onSubmit={handleSearch} className="ih-search flex-1 max-w-md">
        <Search className="h-4 w-4 flex-shrink-0" style={{ color: "var(--ih-text-muted)" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar candidatos, ofertas..."
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            style={{ color: "var(--ih-text-muted)" }}
            className="hover:opacity-70 transition-opacity cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      <div className="flex items-center gap-3 ml-4" ref={dropdownRef}>
        {/* Campanita */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className={`relative p-2 rounded-lg transition-all cursor-pointer ${
            showNotifications ? "bg-slate-100 text-slate-800" : "text-[var(--ih-text-muted)] hover:bg-slate-50"
          }`}
          aria-label="Notificaciones"
          style={{ position: "relative" }}
        >
          <Bell className={`h-5 w-5 ${unreadCount > 0 ? "animate-pulse" : ""}`} />
          {unreadCount > 0 && (
            <span
              className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
              style={{
                background: "linear-gradient(135deg, #FF6B6B, #EE5253)",
                transform: "translate(25%, -25%)",
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Panel */}
        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute right-4 top-16 z-50 w-80 md:w-96 rounded-xl border border-[var(--ih-border)] bg-white shadow-xl overflow-hidden"
              style={{
                boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
              }}
            >
              {/* Header Dropdown */}
              <div
                className="px-4 py-3 border-b border-[var(--ih-border)] flex items-center justify-between"
                style={{ background: "#FAFBFC" }}
              >
                <div>
                  <h3 className="font-semibold text-sm" style={{ color: "var(--ih-text-primary)" }}>
                    Notificaciones
                  </h3>
                  <p className="text-xs" style={{ color: "var(--ih-text-muted)" }}>
                    Tienes {unreadCount} mensajes sin leer
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-xs font-semibold hover:opacity-80 transition-opacity cursor-pointer"
                    style={{ color: "#4F62D0" }}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Marcar leídas
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-[24rem] overflow-y-auto divide-y divide-[var(--ih-border)]">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-[var(--ih-text-muted)] text-sm">
                    No tienes notificaciones
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => toggleUnread(n.id)}
                      className={`p-4 flex gap-3 transition-colors cursor-pointer hover:bg-slate-50 ${
                        n.unread ? "bg-indigo-50/20" : ""
                      }`}
                    >
                      {getCategoryIcon(n.category)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <p
                            className={`text-sm truncate ${n.unread ? "font-semibold" : "font-medium"}`}
                            style={{ color: "var(--ih-text-primary)" }}
                          >
                            {n.title}
                          </p>
                          {n.unread && (
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                              style={{ background: "var(--ih-accent)" }}
                            />
                          )}
                        </div>
                        <p className="text-xs mt-0.5 leading-relaxed text-slate-500 break-words">
                          {n.description}
                        </p>
                        <p className="text-[10px] mt-1.5 text-slate-400 font-medium">
                          {n.time}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}