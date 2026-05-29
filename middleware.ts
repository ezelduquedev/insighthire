import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

interface RequestWithAuth extends NextRequest {
  auth?: {
    user?: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: string
    }
  }
}

export default auth((req: RequestWithAuth) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth?.user
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth")
  const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard")

  if (isApiAuthRoute) {
    return NextResponse.next()
  }

  if (isDashboardRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  if (isLoggedIn && (nextUrl.pathname === "/login" || nextUrl.pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
}