"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useCachedFetch } from "@/hooks/use-cached-fetch"
import { PageTransition } from "@/components/animations/PageTransition"
import { StaggerList } from "@/components/animations/StaggerList"
import { ActivityFeedItem } from "@/components/shared/ActivityFeedItem"
import { Input } from "@/components/ui/input"
import type { StatusType } from "@/components/shared/StatusBadge"
import { Search } from "lucide-react"

interface FeedItem {
  id: string
  type: string
  title: string
  summary: string | null
  date: string
  entitySlug: string | null
  relatedMember: { slug: string; name: string } | null
}

const CATEGORY_MAP: Record<string, string> = {
  LAW: "Law",
  VOTE: "Floor Vote",
  STATEMENT: "Statement",
  PROMISE_UPDATE: "Promise Update",
  APPOINTMENT: "Appointment",
  CONTROVERSY: "Controversy",
}

const STATUS_MAP: Record<string, StatusType> = {
  LAW: "passed",
  VOTE: "neutral",
  STATEMENT: "primary",
  PROMISE_UPDATE: "kept",
  APPOINTMENT: "neutral",
  CONTROVERSY: "warning",
}

function typeToHref(type: string, entitySlug: string | null): string {
  if (!entitySlug) return "#"
  const map: Record<string, string> = {
    LAW: `/laws/${entitySlug}`,
    VOTE: `/votes/${entitySlug}`,
    PROMISE_UPDATE: `/promises`,
    STATEMENT: `/timeline`,
  }
  return map[type] ?? "#"
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

const CATEGORIES = ["All Categories", "LAW", "VOTE", "STATEMENT", "PROMISE_UPDATE", "APPOINTMENT", "CONTROVERSY"]

export default function TimelinePage() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("All Categories")

  // Construct initial URL for cached fetch
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({ limit: "15" })
    if (typeFilter !== "All Categories") params.set("type", typeFilter)
    return `/api/feed?${params}`
  }, [typeFilter])

  // Use cached fetch for initial load
  const { data: initialResponse, loading } = useCachedFetch<{data: FeedItem[], meta?: {hasMore?: boolean, nextCursor?: string | null}}>(apiUrl)

  // Initialize items and pagination state from response
  useEffect(() => {
    if (initialResponse?.data) {
      setItems(initialResponse.data)
      setHasMore(initialResponse.meta?.hasMore ?? false)
      setNextCursor(initialResponse.meta?.nextCursor ?? null)
    }
  }, [initialResponse])

  // Manual fetch for "Load More"
  const fetchMore = useCallback(async (cursor: string | null) => {
    if (!cursor) return
    setLoadingMore(true)

    try {
      const params = new URLSearchParams({ limit: "15", cursor })
      if (typeFilter !== "All Categories") params.set("type", typeFilter)

      const res = await fetch(`/api/feed?${params}`)
      const json = await res.json()
      if (json.data) {
        setItems(prev => [...prev, ...json.data])
      }
      if (json.meta) {
        setHasMore(json.meta.hasMore ?? false)
        setNextCursor(json.meta.nextCursor ?? null)
      }
    } catch (e) {
      console.error("Failed to load more feed:", e)
    } finally {
      setLoadingMore(false)
    }
  }, [typeFilter])

  const filtered = search
    ? items.filter(item => item.title.toLowerCase().includes(search.toLowerCase()) || (item.summary ?? "").toLowerCase().includes(search.toLowerCase()))
    : items

  return (
    <PageTransition className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-10 w-full">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
          Full Activity Timeline
        </h1>
        <p className="text-lg text-muted-foreground">
          A definitive, chronological feed of every action, vote, statement, and law
          triggered by the governing party since taking office in March 2026.
        </p>
      </div>

      {/* Filter / Search */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card border border-border rounded-md sticky top-[72px] z-10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search timeline..." className="pl-9 bg-background" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="relative inline-flex">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 w-full sm:w-auto appearance-none rounded-md border border-input bg-background pl-3 pr-10 py-2 text-sm ring-offset-background cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c === "All Categories" ? c : CATEGORY_MAP[c] ?? c}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* The Timeline Canvas */}
      {loading ? (
        <div className="bg-card border border-border rounded-md p-6 sm:p-10 space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex gap-4">
              <div className="w-2 h-2 bg-muted rounded-full mt-2" />
              <div className="flex-1">
                <div className="h-3 bg-muted rounded w-1/4 mb-2" />
                <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="bg-card border border-border rounded-md p-6 sm:p-10">
          <StaggerList>
            {filtered.map((item, index) => (
              <ActivityFeedItem
                key={item.id}
                date={formatDate(item.date)}
                title={item.title}
                description={item.summary ?? ""}
                category={CATEGORY_MAP[item.type] ?? item.type}
                status={STATUS_MAP[item.type] ?? "neutral"}
                href={typeToHref(item.type, item.entitySlug)}
                isLast={index === filtered.length - 1}
              />
            ))}
          </StaggerList>

          {/* Load More */}
          {hasMore && (
            <div className="pt-8 pb-4 flex justify-center border-t border-border mt-8">
              <button
                onClick={() => fetchMore(nextCursor)}
                disabled={loadingMore}
                className="text-sm font-medium text-muted-foreground hover:text-primary cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-2 py-1"
              >
                {loadingMore ? "Loading..." : "Load Older Events"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-md p-10 text-center text-muted-foreground">
          No activity found.
        </div>
      )}
    </PageTransition>
  )
}
