"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Users, Upload, Briefcase,
  GitCompare, Settings, Menu, X, LogOut,
} from "lucide-react"
import { signOut } from "next-auth/react"

const navItems = [
  { href: "/dashboard",            label: "Dashboard",  icon: LayoutDashboard },
  { href: "/dashboard/candidates", label: "Candidatos", icon: Users },
  { href: "/dashboard/upload",     label: "Upload",     icon: Upload },
  { href: "/dashboard/offers",     label: "Ofertas",    icon: Briefcase },
  { href: "/dashboard/matches",    label: "Matches",    icon: GitCompare },
  { href: "/dashboard/settings",   label: "Ajustes",    icon: Settings },
]

export function DashboardSidebar({ user }: { user: any }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-3 left-3 z-50 lg:hidden p-2 rounded-lg bg-white border border-[var(--ih-border)] shadow-sm text-[var(--ih-text-secondary)]"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Abrir menú"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          ih-sidebar
          transform transition-transform duration-300 lg:translate-x-0
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="p-4 border-b border-[var(--ih-border)]">
          <Link href="/dashboard" className="flex items-center gap-2.5 px-1.5 py-0.5">
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
            <span className="font-bold text-lg tracking-tight" style={{ color: "var(--ih-text-primary)" }}>
              Insight<span style={{ color: "#4F62D0" }}>Hire</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="ih-section-label mt-2 mb-1">Principal</p>
          {navItems.slice(0, 2).map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`ih-nav-item ${active ? "active" : ""}`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}

          <p className="ih-section-label mt-4 mb-1">Gestión</p>
          {navItems.slice(2, 5).map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`ih-nav-item ${active ? "active" : ""}`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}

          <p className="ih-section-label mt-4 mb-1">Cuenta</p>
          {navItems.slice(5).map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`ih-nav-item ${active ? "active" : ""}`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="p-3 border-t border-[var(--ih-border)]">
          <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-lg" style={{ background: "var(--ih-surface-2)" }}>
            <div className="ih-avatar" style={{ width: "2rem", height: "2rem", fontSize: ".75rem" }}>
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--ih-text-primary)" }}>
                {user?.name || user?.email}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--ih-text-muted)" }}>
                {user?.role?.charAt(0) + (user?.role?.slice(1)?.toLowerCase() ?? "") || "Reclutador"}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="ih-nav-item w-full text-left cursor-pointer"
            style={{ color: "var(--ih-danger)" }}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}