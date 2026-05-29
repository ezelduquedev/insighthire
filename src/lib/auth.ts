// eslint-disable-next-line @typescript-eslint/no-require-imports
const NextAuth = require("next-auth").default
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Credentials = require("next-auth/providers/credentials").default
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaAdapter } = require("@auth/prisma-adapter")
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require("bcryptjs")
import { prisma } from "@/lib/prisma"

const result = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      authorize: async (credentials: any) => {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) return null

        const passwordOk = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!passwordOk) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jwt({ token, user }: { token: any; user: any }) {
      if (user) token.id = user.id
      return token
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session({ session, token }: { session: any; token: any }) {
      if (token && session.user) session.user.id = token.id
      return session
    },
  },
})

export const { handlers, auth, signIn, signOut } = result