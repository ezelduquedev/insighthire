declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      email: string
      name?: string | null
      image?: string | null
    }
  }
  interface User {
    role: string
    id: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    id: string
  }
}