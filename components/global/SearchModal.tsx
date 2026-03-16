"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  X,
  FileText,
  User,
  CheckCircle2,
  Quote,
  ArrowRight,
  Loader2,
  BookOpen,
  Users,
  Calendar,
  TrendingUp,
  BarChart2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

// ─── Context ────────────────────────────────────────────────────────────────

interface SearchContextType {
  isOpen: boolean
  openSearch: () => void
  closeSearch: () => void
  toggleSearch: () => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function useSearch() {
  const ctx = useContext(SearchContext)
  if (!ctx) throw new Error("useSearch must be used within SearchProvider")
  return ctx
}

// ─── Types ───────────────────────────────────────────────────────────────────

type ResultType = "member" | "law" | "promise" | "statement"

interface SearchResult {
  type: ResultType
  id: string
  title: string
  subtitle: string
  href: string
  status?: string
}

// ─── Config ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  ResultType,
  { icon: React.FC<{ className?: string }>; label: string; color: string }
> = {
  member: { icon: User, label: "MP", color: "text-blue-500 bg-blue-500/10" },
  law: { icon: FileText, label: "Law", color: "text-emerald-500 bg-emerald-500/10" },
  promise: { icon: CheckCircle2, label: "Promise", color: "text-amber-500 bg-amber-500/10" },
  statement: { icon: Quote, label: "Statement", color: "text-purple-500 bg-purple-500/10" },
}

const QUICK_LINKS = [
  { label: "MPs & Members", href: "/members", icon: Users, desc: "Browse all RSP members" },
  { label: "Laws & Bills", href: "/laws", icon: BookOpen, desc: "Track legislation" },
  { label: "Promises", href: "/promises", icon: CheckCircle2, desc: "Citizen contract" },
  { label: "Votes", href: "/votes", icon: TrendingUp, desc: "Parliamentary votes" },
  { label: "Statements", href: "/statements", icon: Quote, desc: "Public statements" },
  { label: "Analytics", href: "/analytics", icon: BarChart2, desc: "Data & charts" },
  { label: "Timeline", href: "/timeline", icon: Calendar, desc: "Activity feed" },
  { label: "Appointments", href: "/appointments", icon: Calendar, desc: "Cabinet positions" },
]

// ─── Debounce hook ────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const debouncedQuery = useDebounce(query, 280)

  const openSearch = () => setIsOpen(true)
  const closeSearch = () => {
    setIsOpen(false)
    setQuery("")
    setResults([])
    setSelectedIdx(-1)
  }
  const toggleSearch = () => setIsOpen((v) => !v)

  // Fetch results
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setSelectedIdx(-1)
      setLoading(false)
      return
    }
    setLoading(true)
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=5`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.data) return
        const { members, laws, promises, statements } = json.data as {
          members: { slug: string; name: string; role?: string; constituency?: string }[]
          laws: { slug: string; title: string; status: string; category: string; code?: string }[]
          promises: { slug: string; title: string; status: string; category: string }[]
          statements: { id: string; title: string; member?: { name: string; slug: string } | null }[]
        }
        const flat: SearchResult[] = [
          ...members.slice(0, 3).map((m) => ({
            type: "member" as const,
            id: m.slug,
            title: m.name,
            subtitle: [m.role, m.constituency].filter(Boolean).join(" · ") || "RSP Member",
            href: `/members/${m.slug}`,
          })),
          ...laws.slice(0, 3).map((l) => ({
            type: "law" as const,
            id: l.slug,
            title: l.title,
            subtitle: [l.code, l.category].filter(Boolean).join(" · "),
            href: `/laws/${l.slug}`,
            status: l.status,
          })),
          ...promises.slice(0, 2).map((p) => ({
            type: "promise" as const,
            id: p.slug,
            title: p.title,
            subtitle: p.category,
            href: `/promises`,
            status: p.status,
          })),
          ...statements.slice(0, 2).map((s) => ({
            type: "statement" as const,
            id: s.id,
            title: s.title,
            subtitle: s.member?.name ?? "Party Statement",
            href: `/statements`,
          })),
        ]
        setResults(flat)
        setSelectedIdx(-1)
      })
      .finally(() => setLoading(false))
  }, [debouncedQuery])

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIdx < 0 || !listRef.current) return
    const item = listRef.current.querySelector(
      `[data-idx="${selectedIdx}"]`
    ) as HTMLElement | null
    item?.scrollIntoView({ block: "nearest" })
  }, [selectedIdx])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        toggleSearch()
        return
      }
      if (!isOpen) return
      if (e.key === "Escape") { closeSearch(); return }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIdx((i) => Math.min(i + 1, results.length - 1))
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIdx((i) => Math.max(i - 1, -1))
      }
      if (e.key === "Enter") {
        e.preventDefault()
        if (selectedIdx >= 0 && results[selectedIdx]) {
          router.push(results[selectedIdx].href)
          closeSearch()
        } else if (query.trim()) {
          router.push(`/search?q=${encodeURIComponent(query.trim())}`)
          closeSearch()
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, query, results, selectedIdx])

  const hasQuery = query.trim().length > 0
  const showEmpty = hasQuery && !loading && results.length === 0 && debouncedQuery === query

  return (
    <SearchContext.Provider value={{ isOpen, openSearch, closeSearch, toggleSearch }}>
      {children}

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] sm:pt-[18vh] px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
              onClick={closeSearch}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-xl overflow-hidden"
            >
              {/* Input bar */}
              <div className="flex items-center px-4 py-3.5 border-b border-border gap-3">
                {loading ? (
                  <Loader2 className="w-5 h-5 text-muted-foreground animate-spin shrink-0" />
                ) : (
                  <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
                <input
                  ref={inputRef}
                  type="text"
                  autoFocus
                  placeholder="Search MPs, laws, promises, statements…"
                  className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelectedIdx(-1) }}
                />
                {hasQuery && (
                  <button
                    onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus() }}
                    className="p-1 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Body */}
              <div ref={listRef} className="max-h-[58vh] overflow-y-auto">
                {!hasQuery ? (
                  /* Quick links — no query */
                  <div className="p-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2.5">
                      Quick Access
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                      {QUICK_LINKS.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={closeSearch}
                          className="flex flex-col items-center gap-2 px-2 py-3 rounded-lg hover:bg-secondary transition-colors text-center group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-primary/8 border border-border flex items-center justify-center group-hover:bg-primary/15 group-hover:border-primary/30 transition-colors">
                            <link.icon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-foreground leading-tight">{link.label}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">{link.desc}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : showEmpty ? (
                  /* Empty state */
                  <div className="py-10 px-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                      <Search className="w-5 h-5 text-muted-foreground opacity-60" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No results for &ldquo;{debouncedQuery}&rdquo;</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">Try different keywords or browse sections</p>
                    <button
                      onClick={() => { router.push(`/search?q=${encodeURIComponent(query.trim())}`); closeSearch() }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
                    >
                      Search all content <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  /* Results list */
                  <div className="p-2">
                    {results.map((result, idx) => {
                      const cfg = TYPE_CONFIG[result.type]
                      const isSelected = idx === selectedIdx
                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          data-idx={idx}
                          onClick={() => { router.push(result.href); closeSearch() }}
                          onMouseEnter={() => setSelectedIdx(idx)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left outline-none",
                            isSelected ? "bg-secondary" : "hover:bg-secondary/60"
                          )}
                        >
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", cfg.color)}>
                            <cfg.icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{result.title}</div>
                            <div className="text-xs text-muted-foreground truncate">{result.subtitle}</div>
                          </div>
                          <span className={cn("text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0", cfg.color)}>
                            {cfg.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-border bg-secondary/20 flex items-center justify-between gap-4">
                {hasQuery && results.length > 0 ? (
                  <button
                    onClick={() => { router.push(`/search?q=${encodeURIComponent(query.trim())}`); closeSearch() }}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline underline-offset-2"
                  >
                    See all results for &ldquo;{query.trim()}&rdquo;
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground">Type to search across all content</span>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                  <span className="hidden sm:flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-mono text-[10px]">↑↓</kbd>
                    to navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-mono text-[10px]">↵</kbd>
                    to select
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </SearchContext.Provider>
  )
}
