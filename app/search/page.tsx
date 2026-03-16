"use client"

import { useCallback, useEffect, useRef, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageTransition } from "@/components/animations/PageTransition"
import { StatusBadge } from "@/components/shared/StatusBadge"
import type { StatusType } from "@/components/shared/StatusBadge"
import {
  Search,
  X,
  User,
  FileText,
  CheckCircle2,
  Quote,
  BookOpen,
  Users,
  TrendingUp,
  Calendar,
  BarChart2,
  ArrowRight,
  Loader2,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

interface MemberResult {
  slug: string
  name: string
  role?: string | null
  constituency?: string | null
  province?: string | null
  isActive?: boolean
}

interface LawResult {
  slug: string
  title: string
  status: string
  category: string
  summary?: string | null
  code?: string | null
  proposedDate?: string
}

interface PromiseResult {
  slug: string
  title: string
  status: string
  category: string
  description?: string | null
}

interface StatementResult {
  id: string
  title: string
  content?: string | null
  date: string
  member?: { name: string; slug: string } | null
}

interface SearchData {
  members: MemberResult[]
  laws: LawResult[]
  promises: PromiseResult[]
  statements: StatementResult[]
  query: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LAW_STATUS_MAP: Record<string, StatusType> = {
  PASSED: "passed",
  ENACTED: "passed",
  PROPOSED: "pending",
  COMMITTEE: "pending",
  DRAFT: "pending",
  REJECTED: "rejected",
}

const PROMISE_STATUS_MAP: Record<string, StatusType> = {
  KEPT: "kept",
  IN_PROGRESS: "pending",
  BROKEN: "rejected",
  NOT_STARTED: "neutral",
}

type Tab = "all" | "members" | "laws" | "promises" | "statements"

const TABS: { key: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { key: "all", label: "All", icon: Search },
  { key: "members", label: "MPs", icon: Users },
  { key: "laws", label: "Laws & Bills", icon: BookOpen },
  { key: "promises", label: "Promises", icon: CheckCircle2 },
  { key: "statements", label: "Statements", icon: Quote },
]

const BROWSE_CARDS = [
  { label: "MPs & Members", href: "/members", icon: Users, desc: "Browse all 34 RSP members" },
  { label: "Laws & Bills", href: "/laws", icon: BookOpen, desc: "Track passed and pending legislation" },
  { label: "Promises", href: "/promises", icon: CheckCircle2, desc: "Citizen contract tracker" },
  { label: "Votes", href: "/votes", icon: TrendingUp, desc: "Parliamentary roll-call votes" },
  { label: "Statements", href: "/statements", icon: Quote, desc: "Speeches and press releases" },
  { label: "Timeline", href: "/timeline", icon: Calendar, desc: "Chronological activity feed" },
  { label: "Appointments", href: "/appointments", icon: Calendar, desc: "Cabinet & committee posts" },
  { label: "Analytics", href: "/analytics", icon: BarChart2, desc: "Data charts and breakdowns" },
]

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-md p-5 flex gap-4 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    </div>
  )
}

// ─── Result cards ─────────────────────────────────────────────────────────────

function MemberCard({ m }: { m: MemberResult }) {
  const initials = m.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
  return (
    <Link
      href={`/members/${m.slug}`}
      className="bg-card border border-border rounded-md p-5 flex items-start gap-4 hover:border-primary/40 hover:shadow-sm transition-all group"
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0 group-hover:bg-primary/20 transition-colors">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm group-hover:text-primary transition-colors">{m.name}</span>
          {m.isActive === false && (
            <StatusBadge status="neutral">Inactive</StatusBadge>
          )}
        </div>
        {(m.role || m.constituency) && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {[m.role, m.constituency].filter(Boolean).join(" · ")}
          </p>
        )}
        {m.province && (
          <p className="text-[10px] text-muted-foreground mt-1 font-medium uppercase tracking-wider">{m.province}</p>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
    </Link>
  )
}

function LawCard({ l }: { l: LawResult }) {
  return (
    <Link
      href={`/laws/${l.slug}`}
      className="bg-card border border-border rounded-md p-5 flex flex-col gap-2 hover:border-primary/40 hover:shadow-sm transition-all group"
    >
      <div className="flex flex-wrap items-center gap-2">
        {l.code && (
          <span className="font-mono text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-sm">
            {l.code}
          </span>
        )}
        <StatusBadge status={LAW_STATUS_MAP[l.status] ?? "neutral"}>{l.status}</StatusBadge>
        <StatusBadge status="neutral">{l.category}</StatusBadge>
      </div>
      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">{l.title}</h3>
      {l.summary && (
        <p className="text-xs text-muted-foreground line-clamp-2">{l.summary}</p>
      )}
    </Link>
  )
}

function PromiseCard({ p }: { p: PromiseResult }) {
  return (
    <div className="bg-card border border-border rounded-md p-5 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={PROMISE_STATUS_MAP[p.status] ?? "neutral"}>
          {p.status.replace("_", " ")}
        </StatusBadge>
        <StatusBadge status="neutral">{p.category}</StatusBadge>
      </div>
      <h3 className="font-semibold text-sm line-clamp-2">{p.title}</h3>
      {p.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
      )}
    </div>
  )
}

function StatementCard({ s }: { s: StatementResult }) {
  return (
    <div className="bg-card border border-border rounded-md p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-sm line-clamp-2 flex-1">{s.title}</h3>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>
      {s.content && (
        <p className="text-xs text-muted-foreground line-clamp-2">{s.content}</p>
      )}
      {s.member && (
        <Link
          href={`/members/${s.member.slug}`}
          className="text-xs font-medium text-primary hover:underline w-fit"
        >
          {s.member.name}
        </Link>
      )}
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  label,
  count,
  browseHref,
}: {
  icon: React.FC<{ className?: string }>
  label: string
  count: number
  browseHref: string
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-semibold text-sm text-foreground">{label}</h2>
        <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">{count}</span>
      </div>
      <Link
        href={browseHref}
        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
      >
        Browse all <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-12 flex flex-col gap-6">
        <div className="h-10 bg-muted rounded w-1/3 animate-pulse" />
        <div className="h-12 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-md p-5 h-20 animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}

function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const initialQ = searchParams.get("q") ?? ""
  const initialTab = (searchParams.get("tab") as Tab) ?? "all"

  const [inputValue, setInputValue] = useState(initialQ)
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [data, setData] = useState<SearchData | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedInput = useDebounce(inputValue, 320)

  // Sync URL when query or tab changes
  const updateUrl = useCallback(
    (q: string, tab: Tab) => {
      const params = new URLSearchParams()
      if (q) params.set("q", q)
      if (tab !== "all") params.set("tab", tab)
      const search = params.toString()
      router.replace(`/search${search ? `?${search}` : ""}`, { scroll: false })
    },
    [router]
  )

  useEffect(() => {
    updateUrl(debouncedInput, activeTab)
  }, [debouncedInput, activeTab, updateUrl])

  // Fetch results whenever debounced query changes
  useEffect(() => {
    setLoading(true)
    const url = debouncedInput.trim()
      ? `/api/search?q=${encodeURIComponent(debouncedInput.trim())}&limit=12`
      : `/api/search`
    fetch(url)
      .then((r) => r.json())
      .then((json) => { if (json.data) setData(json.data as SearchData) })
      .finally(() => setLoading(false))
  }, [debouncedInput])

  const hasQuery = inputValue.trim().length > 0
  const isReady = !loading && data !== null

  // Count results per tab
  const counts = data
    ? {
        all: data.members.length + data.laws.length + data.promises.length + data.statements.length,
        members: data.members.length,
        laws: data.laws.length,
        promises: data.promises.length,
        statements: data.statements.length,
      }
    : { all: 0, members: 0, laws: 0, promises: 0, statements: 0 }

  const noResults = hasQuery && isReady && counts.all === 0

  return (
    <PageTransition className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-8 w-full">

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
          {hasQuery ? `Results for "${debouncedInput}"` : "Search RSP Watch"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {hasQuery && isReady
            ? `${counts.all} result${counts.all !== 1 ? "s" : ""} across MPs, laws, promises, and statements`
            : "Find MPs, laws, promises, statements, and more"}
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          autoFocus={!hasQuery}
          placeholder="Search MPs, laws, promises, statements…"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") { setInputValue(""); inputRef.current?.blur() }
          }}
          className="w-full pl-12 pr-12 py-3.5 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors text-base shadow-sm"
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
        {!loading && hasQuery && (
          <button
            onClick={() => { setInputValue(""); inputRef.current?.focus() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground transition-colors rounded"
            aria-label="Clear"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs — only show when there's a query */}
      {hasQuery && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
          {TABS.map((tab) => {
            const count = counts[tab.key]
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                )}
              >
                {tab.label}
                {isReady && count > 0 && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                    isActive ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* ── No query: Browse & Recommended ─────────────────────────────────── */}
      {!hasQuery && (
        <div className="flex flex-col gap-10">
          {/* Browse categories */}
          <section className="flex flex-col gap-4">
            <h2 className="font-display font-semibold text-lg">Browse by Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {BROWSE_CARDS.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="bg-card border border-border rounded-md p-4 flex flex-col gap-3 hover:border-primary/40 hover:shadow-sm transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/8 border border-border flex items-center justify-center group-hover:bg-primary/15 group-hover:border-primary/30 transition-colors">
                    <card.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold group-hover:text-primary transition-colors">{card.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{card.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Recommended content — from API */}
          {isReady && data && (
            <>
              {data.members.length > 0 && (
                <section>
                  <SectionHeader icon={Users} label="Featured MPs" count={data.members.length} browseHref="/members" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.members.map((m) => <MemberCard key={m.slug} m={m} />)}
                  </div>
                </section>
              )}
              {data.laws.length > 0 && (
                <section>
                  <SectionHeader icon={BookOpen} label="Recent Laws" count={data.laws.length} browseHref="/laws" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.laws.map((l) => <LawCard key={l.slug} l={l} />)}
                  </div>
                </section>
              )}
              {data.promises.length > 0 && (
                <section>
                  <SectionHeader icon={CheckCircle2} label="Recent Promises" count={data.promises.length} browseHref="/promises" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.promises.map((p) => <PromiseCard key={p.slug} p={p} />)}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Skeleton while loading recommended */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Has query: loading skeleton ─────────────────────────────────────── */}
      {hasQuery && loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      )}

      {/* ── Has query: no results ───────────────────────────────────────────── */}
      {noResults && (
        <div className="py-16 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <Search className="w-7 h-7 text-muted-foreground opacity-50" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">No results for &ldquo;{debouncedInput}&rdquo;</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-sm">
              Try different keywords, check your spelling, or browse a category below.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {["Rabi Lamichhane", "Education", "Budget", "Anti-corruption"].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInputValue(suggestion)}
                className="text-xs bg-secondary hover:bg-secondary/80 text-foreground px-3 py-1.5 rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Has query: results ──────────────────────────────────────────────── */}
      {hasQuery && isReady && !noResults && (
        <div className="flex flex-col gap-10">

          {/* All tab: grouped sections */}
          {activeTab === "all" && (
            <>
              {data!.members.length > 0 && (
                <section>
                  <SectionHeader icon={Users} label="MPs" count={data!.members.length} browseHref="/members" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data!.members.map((m) => <MemberCard key={m.slug} m={m} />)}
                  </div>
                </section>
              )}
              {data!.laws.length > 0 && (
                <section>
                  <SectionHeader icon={BookOpen} label="Laws & Bills" count={data!.laws.length} browseHref="/laws" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data!.laws.map((l) => <LawCard key={l.slug} l={l} />)}
                  </div>
                </section>
              )}
              {data!.promises.length > 0 && (
                <section>
                  <SectionHeader icon={CheckCircle2} label="Promises" count={data!.promises.length} browseHref="/promises" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data!.promises.map((p) => <PromiseCard key={p.slug} p={p} />)}
                  </div>
                </section>
              )}
              {data!.statements.length > 0 && (
                <section>
                  <SectionHeader icon={Quote} label="Statements" count={data!.statements.length} browseHref="/statements" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data!.statements.map((s) => <StatementCard key={s.id} s={s} />)}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Filtered tabs */}
          {activeTab === "members" && (
            data!.members.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data!.members.map((m) => <MemberCard key={m.slug} m={m} />)}
              </div>
            ) : (
              <EmptyTab label="MPs" query={debouncedInput} />
            )
          )}
          {activeTab === "laws" && (
            data!.laws.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data!.laws.map((l) => <LawCard key={l.slug} l={l} />)}
              </div>
            ) : (
              <EmptyTab label="laws" query={debouncedInput} />
            )
          )}
          {activeTab === "promises" && (
            data!.promises.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data!.promises.map((p) => <PromiseCard key={p.slug} p={p} />)}
              </div>
            ) : (
              <EmptyTab label="promises" query={debouncedInput} />
            )
          )}
          {activeTab === "statements" && (
            data!.statements.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data!.statements.map((s) => <StatementCard key={s.id} s={s} />)}
              </div>
            ) : (
              <EmptyTab label="statements" query={debouncedInput} />
            )
          )}
        </div>
      )}
    </PageTransition>
  )
}

function EmptyTab({ label, query }: { label: string; query: string }) {
  return (
    <div className="py-12 text-center bg-card border border-dashed border-border rounded-md">
      <p className="font-medium text-sm">No {label} matched &ldquo;{query}&rdquo;</p>
      <p className="text-xs text-muted-foreground mt-1">Try switching to the All tab or refine your search.</p>
    </div>
  )
}
