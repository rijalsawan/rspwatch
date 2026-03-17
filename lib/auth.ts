import { NextRequest } from "next/server"
import { error } from "./api-response"
import type { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"

export function validateAdmin(request: NextRequest) {
  const secret = request.headers.get("x-admin-secret")
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return error("Unauthorized", 401)
  }
  return null // null means valid
}

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Username",
      credentials: {
        username: { label: "Username", type: "text" },
      },
      async authorize(credentials) {
        const raw = credentials?.username?.trim()
        if (!raw || raw.length < 2 || raw.length > 30) return null

        // Normalize to safe characters: 2–30 chars, letters/numbers/underscores
        const normalized = raw.toLowerCase().replace(/[^a-z0-9_]/g, "")
        if (!normalized || normalized.length < 2) return null

        // We use a deterministic internal email so the unique constraint on User.email is satisfied.
        // It is never surfaced to the user and no email is ever sent to it.
        const internalEmail = `${normalized}@parliamentwatch.local`

        const user = await prisma.user.upsert({
          where: { email: internalEmail },
          update: {},
          create: { name: raw, email: internalEmail },
        })

        return { id: user.id, name: user.name, email: user.email }
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.userId = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId as string
      }
      return session
    },
  },

  // Don't redirect to a sign-in page — the modal handles everything in-place
  pages: { signIn: "/" },
}
