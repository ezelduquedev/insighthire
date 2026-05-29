"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Search, X } from "lucide-react"

export function DashboardHeader({ user }: { user: any }) {
  const [query, setQuery] = useState("")
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    router.push(`/dashboard/candidates?search=${encodeURIComponent(q)}`)
  }

  return (
    <header className="ih-header">
      <form onSubmit={handleSearch} className="ih-search flex-1 max-w-md">
        <Search className="h-4 w-4 flex-shrink-0" style={{ color: "var(--ih-text-muted)" }} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
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

      <div className="flex items-center gap-3 ml-4">
        <button
          className="relative p-2 rounded-lg transition-colors cursor-pointer"
          style={{ color: "var(--ih-text-muted)" }}
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--ih-danger)" }}
          />
        </button>
      </div>
    </header>
  )
}