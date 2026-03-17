"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { PageTransition } from "@/components/animations/PageTransition"
import { StaggerList } from "@/components/animations/StaggerList"
import { StatusBadge } from "@/components/shared/StatusBadge"
import type { StatusType } from "@/components/shared/StatusBadge"
import { useAuthModal } from "@/components/global/AuthModal"
import {
  Search, Flame, Gavel, AlertTriangle, MessageSquare,
  Users, TrendingUp, BarChart3, ThumbsUp,
  ThumbsDown, Minus, Eye, Loader2,
} from "lucide-react"
import Link from "next/link"

const PAGE_SIZE = 20
const CACHE_KEY = "discussions_tab_cache"

// ─── Types ────────────────────────────────────────────────────

interface DiscussionItem {
  id: string
  type: "LAW" | "CONTROVERSY"
  slug: string
  title: string
  summary: string
  category: string
  date: string
  severity?: string
  status?: string
  commentCount: number
  stance: { support: number; oppose: number; neutral: number }
  totalVotes: number
  member: { name: string; slug: string } | null
}

interface TabCache {
  items: DiscussionItem[]
  page: number
  hasMore: boolean
}

type TabKey = "trending" | "law" | "controversy"

const TABS: { key: TabKey; label: string; icon: typeof Flame }[] = [
  { key: "trending", label: "Trending", icon: Flame },
  { key: "law", label: "Laws & Bills", icon: Gavel },
  { key: "controversy", label: "Controversies", icon: AlertTriangle },
]

// ─── Helpers ────────────────────────────────────────────────────

function initializeCache(): Record<TabKey, TabCache> {
  // Try to restore from sessionStorage first
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem(CACHE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {
      // Fallback to empty cache if parsing fails
    }
  }

  return {
    trending: { items: [], page: 0, hasMore: false },
    law: { items: [], page: 0, hasMore: false },
    controversy: { items: [], page: 0, hasMore: false },
  }
}

function saveCache(cache: Record<TabKey, TabCache>) {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    } catch {
      // Silently fail if sessionStorage is unavailable
    }
  }
}

// ─── Page ─────────────────────────────────────────────────────

export default function DiscussionsPage() {
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<TabKey>("trending")
  const { data: session } = useSession()
  const { openAuthModal } = useAuthModal()

  const [allItems, setAllItems] = useState<DiscussionItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Per-tab cache that persists across navigation via sessionStorage
  const cacheRef = useRef<Record<TabKey, TabCache>>(initializeCache())

  // Switch tabs - use cache if available, otherwise fetch
  useEffect(() => {
    let cancelled = false
    const cached = cacheRef.current[activeTab]

    // If we have cached data for this tab, use it immediately without loading state
    if (cached.page > 0) {
      setAllItems(cached.items)
      setPage(cached.page)
      setHasMore(cached.hasMore)
      setLoading(false)
      return
    }

    // Otherwise, fetch page 1 and show loading state
    setLoading(true)
    setAllItems([])
    setHasMore(false)

    fetch(`/api/discussions?type=${activeTab}&limit=${PAGE_SIZE}&page=1`)
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return
        const data = res.data ?? []
        const hasMoreData = res.meta?.hasMore ?? false

        setAllItems(data)
        setHasMore(hasMoreData)
        setPage(1)

        // Update cache and persist
        cacheRef.current[activeTab] = { items: data, page: 1, hasMore: hasMoreData }
        saveCache(cacheRef.current)
      })
      .catch(() => { if (!cancelled) setAllItems([]) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [activeTab])

  const loadMore = async () => {
    setLoadingMore(true)
    const nextPage = page + 1
    try {
      const res = await fetch(`/api/discussions?type=${activeTab}&limit=${PAGE_SIZE}&page=${nextPage}`)
      const data = await res.json()
      const newItems = [...allItems, ...(data.data ?? [])]
      const hasMoreData = data.meta?.hasMore ?? false

      setAllItems(newItems)
      setHasMore(hasMoreData)
      setPage(nextPage)

      // Update cache and persist
      cacheRef.current[activeTab] = { items: newItems, page: nextPage, hasMore: hasMoreData }
      saveCache(cacheRef.current)
    } finally {
      setLoadingMore(false)
    }
  }

  // Client-side search filter on the already-loaded set
  const filtered = useMemo(() => {
    if (!search) return allItems
    const q = search.toLowerCase()
    return allItems.filter((d) => d.title.toLowerCase().includes(q))
  }, [allItems, search])

  const totalParticipants = allItems.reduce((a, d) => a + d.totalVotes, 0)
  const totalComments = allItems.reduce((a, d) => a + d.commentCount, 0)
  const hotCount = allItems.filter((d) => d.totalVotes > 0 || d.commentCount > 0).length

  return (
    <PageTransition className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16 flex flex-col gap-12">
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="flex flex-col gap-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <StatusBadge status="primary" pulse>Live Forum</StatusBadge>
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {filtered.length} Active {filtered.length === 1 ? "Debate" : "Debates"}
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight tracking-tight text-foreground">
          Public Discourse.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
          Vote, debate, and hold parliament accountable. Your voice on every law, controversy, and policy decision — backed by data.
        </p>
      </section>

      {/* ── Main Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

        {/* Left Col: Debates ─────────────────────────────── */}
        <div className="lg:col-span-8 flex flex-col gap-8">

          {/* Search + Tabs */}
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search debates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-md border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
              />
            </div>

            <div className="flex gap-1 p-1 bg-muted/50 border border-border rounded-md w-fit">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    activeTab === tab.key
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Debate Cards */}
          {loading ? (
            <div className="flex flex-col gap-5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-md p-6 lg:p-8 animate-pulse">
                  <div className="flex gap-2 mb-4">
                    <div className="h-5 w-14 bg-muted rounded-sm" />
                    <div className="h-5 w-20 bg-muted rounded-sm" />
                  </div>
                  <div className="h-7 bg-muted rounded w-3/4 mb-2" />
                  <div className="space-y-1.5 mb-6">
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                  <div className="flex gap-4 mb-6">
                    <div className="h-4 w-20 bg-muted rounded" />
                    <div className="h-4 w-16 bg-muted rounded" />
                  </div>
                  <div className="pt-5 border-t border-border">
                    <div className="h-2 bg-muted rounded-full w-full mb-3" />
                    <div className="flex justify-between">
                      <div className="h-3 w-16 bg-muted rounded" />
                      <div className="h-3 w-12 bg-muted rounded" />
                      <div className="h-3 w-16 bg-muted rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <StaggerList className="flex flex-col gap-5">
              {filtered.map((item) => (
                <DebateCard key={item.id} item={item} />
              ))}
            </StaggerList>
          ) : (
            <div className="bg-card border border-border rounded-md p-12 text-center">
              <Search className="w-8 h-8 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">
                {search ? "No debates match your search." : "No debates in this category yet."}
              </p>
            </div>
          )}

          {/* Load More Button */}
          {!search && hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full py-3 px-4 font-semibold text-sm text-foreground bg-muted/50 hover:bg-muted border border-border rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load More Debates"
              )}
            </button>
          )}
        </div>

        {/* Right Col: Sidebar ────────────────────────────── */}
        <div className="lg:col-span-4 flex flex-col gap-8">

          {/* Community Pulse */}
          <div className="bg-card border border-border p-6 rounded-md flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-[18px] h-[18px] text-primary" />
              </div>
              <h3 className="font-display font-bold text-lg">Community Pulse</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <PulseStat value={totalParticipants} label="Total Votes" />
              <PulseStat value={totalComments} label="Comments" />
              <PulseStat value={filtered.length} label="Active Debates" />
              <PulseStat value={hotCount} label="With Activity" />
            </div>
          </div>

          {/* Trending Topics */}
          {filtered.length > 0 && (
            <div className="bg-card border border-border p-6 rounded-md flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-[18px] h-[18px] text-primary" />
                </div>
                <h3 className="font-display font-bold text-lg">Most Discussed</h3>
              </div>
              <ul className="flex flex-col gap-3">
                {[...filtered]
                  .sort((a, b) => (b.totalVotes + b.commentCount) - (a.totalVotes + a.commentCount))
                  .slice(0, 4)
                  .map((d, i) => (
                    <li key={d.id}>
                      <Link
                        href={`/discussions/${d.slug}`}
                        className="flex items-start gap-3 text-sm group"
                      >
                        <span className="text-xs font-bold text-muted-foreground tabular-nums mt-0.5 w-4 shrink-0">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground font-medium leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                            {d.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {d.totalVotes} votes · {d.commentCount} comments
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Join CTA */}
          <div className="bg-card border border-border p-6 rounded-md flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-lg">Your Voice Matters</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every vote shapes the public record. Pick a stance on laws and controversies to help build Nepal&apos;s civic pulse.
            </p>
            {session ? (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-muted-foreground">
                  Signed in as <span className="text-foreground font-medium">{session.user?.name}</span>
                </span>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="w-full text-sm font-semibold bg-primary text-primary-foreground px-4 py-2.5 rounded-md hover:bg-primary/90 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Pick a Username to Vote
              </button>
            )}
          </div>

          {/* Quick Access */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Laws & Bills", icon: Gavel, href: "/laws" },
              { label: "MPs", icon: Users, href: "/members" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col gap-2 p-4 rounded-md border border-border bg-card hover:border-primary/50 hover:bg-secondary/50 transition-colors group outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="font-semibold text-sm group-hover:text-primary transition-colors">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

// ─── Sub-components ───────────────────────────────────────────

function PulseStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-2xl font-bold tabular-nums text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

function statusToDisplay(status?: string): StatusType {
  if (!status) return "neutral"
  const map: Record<string, StatusType> = {
    PASSED: "passed", ENACTED: "passed", PROPOSED: "pending",
    COMMITTEE: "pending", DRAFT: "pending", REJECTED: "rejected",
    LOW: "neutral", MEDIUM: "warning", HIGH: "warning", CRITICAL: "destructive",
  }
  return map[status] ?? "neutral"
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 1) return "just now"
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  return `${weeks}w ago`
}

function DebateCard({ item }: { item: DiscussionItem }) {
  return (
    <Link
      href={`/discussions/${item.slug}`}
      className="group bg-card border border-border rounded-md p-6 lg:p-8 hover:border-primary/50 transition-colors relative overflow-hidden block"
    >
      {/* Decorative glow */}
      <div
        className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-[0.06] pointer-events-none ${
          item.type === "LAW" ? "bg-primary" : "bg-warning"
        }`}
      />

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-4 relative z-10">
        <StatusBadge status={item.type === "LAW" ? "primary" : "warning"}>
          {item.type === "LAW" ? "Bill" : "Controversy"}
        </StatusBadge>
        <StatusBadge status="neutral">{item.category}</StatusBadge>
        {item.status && (
          <StatusBadge status={statusToDisplay(item.status)}>
            {item.severity ?? item.status}
          </StatusBadge>
        )}
      </div>

      {/* Title */}
      <h3 className="text-xl lg:text-2xl font-semibold mb-2 group-hover:text-primary transition-colors leading-tight relative z-10">
        {item.title}
      </h3>

      {/* Summary */}
      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-6 relative z-10">
        {item.summary}
      </p>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-6 relative z-10">
        <span>{formatTimeAgo(item.date)}</span>
        {item.member && (
          <>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <span>{item.member.name}</span>
          </>
        )}
        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
        <span className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          {item.commentCount}
        </span>
        {item.totalVotes > 0 && (
          <>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              {item.totalVotes} votes
            </span>
          </>
        )}
      </div>

      {/* Stance Footer */}
      <div className="pt-5 border-t border-border flex flex-col gap-3 relative z-10">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Public Stance</span>
        </div>

        <div className="flex h-2 w-full rounded-full overflow-hidden bg-muted">
          <div
            style={{ width: `${item.stance.support}%` }}
            className="bg-success transition-all duration-500"
          />
          <div
            style={{ width: `${item.stance.neutral}%` }}
            className="bg-muted-foreground/30 transition-all duration-500"
          />
          <div
            style={{ width: `${item.stance.oppose}%` }}
            className="bg-destructive transition-all duration-500"
          />
        </div>

        <div className="flex items-center justify-between text-xs font-medium">
          <span className="flex items-center gap-1 text-success">
            <ThumbsUp className="w-3 h-3" />
            {item.stance.support}%
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Minus className="w-3 h-3" />
            {item.stance.neutral}%
          </span>
          <span className="flex items-center gap-1 text-destructive">
            <ThumbsDown className="w-3 h-3" />
            {item.stance.oppose}%
          </span>
        </div>
      </div>
    </Link>
  )
}
