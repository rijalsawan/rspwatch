"use client"

import { SessionProvider } from "next-auth/react"
import { AuthModalProvider } from "./AuthModal"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthModalProvider>{children}</AuthModalProvider>
    </SessionProvider>
  )
}
