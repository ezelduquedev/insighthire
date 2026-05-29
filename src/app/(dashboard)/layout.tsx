import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="ih-shell">
      <DashboardSidebar user={session.user} />
      <div className="ih-main">
        <DashboardHeader user={session.user} />
        <main className="ih-content">
          {children}
        </main>
      </div>
    </div>
  )
}