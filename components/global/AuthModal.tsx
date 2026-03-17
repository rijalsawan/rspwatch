"use client"

import { useState, useCallback, createContext, useContext } from "react"
import { signIn } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { X, UserCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

// ─── Context ─────────────────────────────────────────────────

interface AuthModalContextValue {
  openAuthModal: () => void
  closeAuthModal: () => void
}

export const AuthModalContext = createContext<AuthModalContextValue>({
  openAuthModal: () => {},
  closeAuthModal: () => {},
})

export function useAuthModal() {
  return useContext(AuthModalContext)
}

// ─── Provider (wraps the app, owns modal state) ───────────────

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openAuthModal = useCallback(() => setIsOpen(true), [])
  const closeAuthModal = useCallback(() => setIsOpen(false), [])

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal }}>
      {children}
      <AuthModal isOpen={isOpen} onClose={closeAuthModal} />
    </AuthModalContext.Provider>
  )
}

// ─── Modal UI ─────────────────────────────────────────────────

function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [username, setUsername] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const validate = (val: string) => {
    if (val.trim().length < 2) return "Username must be at least 2 characters."
    if (val.trim().length > 30) return "Username must be 30 characters or less."
    if (!/^[a-zA-Z0-9_ ]+$/.test(val.trim())) return "Only letters, numbers, spaces, and underscores allowed."
    return ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validate(username)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      username: username.trim(),
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError("Something went wrong. Please try a different username.")
    } else {
      setUsername("")
      onClose()
    }
  }

  const handleClose = () => {
    if (loading) return
    setUsername("")
    setError("")
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal card */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm px-4"
          >
            <div className="bg-background border border-border rounded-xl shadow-2xl p-6 flex flex-col gap-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h2 className="font-display font-bold text-lg text-foreground">
                    Join the Conversation
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Pick a username to vote and comment. No password required.
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="auth-username" className="text-sm font-medium text-foreground">
                    Username
                  </label>
                  <div className="relative">
                    <UserCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      id="auth-username"
                      type="text"
                      autoComplete="off"
                      autoFocus
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value)
                        if (error) setError("")
                      }}
                      placeholder="e.g. curious_citizen"
                      maxLength={30}
                      className="w-full h-10 pl-9 pr-3 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
                    />
                  </div>
                  {error && (
                    <p className="text-xs text-destructive">{error}</p>
                  )}
                </div>

                <Button type="submit" disabled={loading || username.trim().length < 2} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Signing in...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center">
                Your username is public. No email or password needed.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
