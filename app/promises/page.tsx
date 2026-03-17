"use client"

import { useState, useMemo } from "react"
import { useCachedFetch } from "@/hooks/use-cached-fetch"
import { PageTransition } from "@/components/animations/PageTransition"
import { StaggerList } from "@/components/animations/StaggerList"
import { AnimatedProgress } from "@/components/animations/AnimatedProgress"
import { GlitchNumber } from "@/components/animations/GlitchNumber"
import { PromiseCard, type PromiseStatus } from "@/components/domain/PromiseCard"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Clock, XCircle, CircleDashed, Search } from "lucide-react"

interface PromiseData {
  id: string
  slug: string
  title: string
  description: string | null
  category: string
  status: string
  source: string | null
  confidence: string
  evidenceUrl: string | null
  lastUpdated: string
}

function dbStatusToFrontend(status: string): PromiseStatus {
  const map: Record<string, PromiseStatus> = {
    KEPT: "kept",
    IN_PROGRESS: "in-progress",
    BROKEN: "broken",
    NOT_STARTED: "not-started",
  }
  return map[status] ?? "not-started"
}

interface PromisesResponse {
  data: PromiseData[]
  meta: {
    byStatus: Record<string, number>
    byCategory: Record<string, Record<string, number>>
  }
}

export default function PromisesPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (statusFilter) params.set("status", statusFilter)
    if (categoryFilter) params.set("category", categoryFilter)
    const qs = params.toString()
    return `/api/promises${qs ? `?${qs}` : ""}`
  }, [statusFilter, categoryFilter])

  const { data: response, loading } = useCachedFetch<PromisesResponse>(apiUrl)

  const promises = response?.data ?? []
  const statusSummary = response?.meta?.byStatus ?? { KEPT: 0, IN_PROGRESS: 0, BROKEN: 0, NOT_STARTED: 0 }
  const categoryBreakdown = response?.meta?.byCategory ?? {}

  const total = statusSummary.KEPT + statusSummary.IN_PROGRESS + statusSummary.BROKEN + statusSummary.NOT_STARTED || 1
  const stats = [
    { label: "Kept", count: statusSummary.KEPT, icon: CheckCircle2, color: "text-success", bg: "bg-success/10", border: "border-success/20" },
    { label: "In Progress", count: statusSummary.IN_PROGRESS, icon: Clock, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
    { label: "Broken", count: statusSummary.BROKEN, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
    { label: "Not Started", count: statusSummary.NOT_STARTED, icon: CircleDashed, color: "text-muted-foreground", bg: "bg-muted/50", border: "border-border" },
  ]

  // Build category bars from API data
  const categories = Object.entries(categoryBreakdown).map(([cat, counts]) => {
    const catTotal = (counts.KEPT ?? 0) + (counts.IN_PROGRESS ?? 0) + (counts.BROKEN ?? 0) + (counts.NOT_STARTED ?? 0)
    return {
      cat,
      kept: catTotal ? Math.round(((counts.KEPT ?? 0) / catTotal) * 100) : 0,
      inProgress: catTotal ? Math.round(((counts.IN_PROGRESS ?? 0) / catTotal) * 100) : 0,
      broken: catTotal ? Math.round(((counts.BROKEN ?? 0) / catTotal) * 100) : 0,
    }
  })

  const filtered = search
    ? promises.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()))
    : promises

  return (
    <PageTransition className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-10 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-4 max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
            Promise Tracker
          </h1>
          <p className="text-lg text-muted-foreground">
            A comprehensive scoreboard of the commitments laid out in the RSP's
            Citizen Contract and 2026 Election Manifesto. We track what's delivered,
            what's stalled, and what's broken.
          </p>
        </div>
      </div>

      {/* Aggregate Stats Dash */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className={`p-5 rounded-md border ${stat.border} flex flex-col gap-3 bg-card`}>
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-sm ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className="font-semibold tracking-wide uppercase text-sm text-foreground">{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-display font-bold tabular-nums">{stat.count}</span>
              <span className="text-sm font-medium text-muted-foreground">({Math.round((stat.count / total) * 100)}%)</span>
            </div>
          </div>
        ))}
      </div>

      {/* Category Fulfillment Progress Bars */}
      {categories.length > 0 && (
        <div className="bg-card border border-border p-6 lg:p-8 rounded-md flex flex-col gap-8">
          <h3 className="font-display font-bold text-xl">Category Fulfillment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {categories.map((c) => {
              const pending = Math.max(0, 100 - c.kept - c.inProgress - c.broken)
              return (
                <div key={c.cat} className="flex flex-col gap-3 group">
                  <div className="flex justify-between items-end">
                    <span className="font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">{c.cat}</span>
                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-display font-bold text-success tabular-nums leading-none">
                        <GlitchNumber value={c.kept} />%
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-1">Kept</span>
                    </div>
                  </div>

                  {/* Segmented Bar */}
                  <div className="flex w-full h-3.5 gap-1 rounded-sm overflow-hidden bg-background">
                    {c.kept > 0 && <AnimatedProgress className="bg-success h-full" value={c.kept} delay={0.1} />}
                    {c.inProgress > 0 && <AnimatedProgress className="bg-warning h-full" value={c.inProgress} delay={0.2} />}
                    {c.broken > 0 && <AnimatedProgress className="bg-destructive h-full" value={c.broken} delay={0.3} />}
                    {pending > 0 && <AnimatedProgress className="bg-muted h-full" value={pending} delay={0.4} />}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-medium tracking-wide text-muted-foreground mt-1">
                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-success"/> {c.kept}% Kept</span>
                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-warning"/> {c.inProgress}% Ongoing</span>
                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-destructive"/> {c.broken}% Broken</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filter and Content */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-card border border-border rounded-md">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search promises..." className="pl-9 bg-background" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <div className="relative inline-flex">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 w-full md:w-auto appearance-none rounded-md border border-input bg-background pl-3 pr-10 py-2 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">All Status</option>
                <option value="KEPT">Kept</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="BROKEN">Broken</option>
                <option value="NOT_STARTED">Not Started</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            <div className="relative inline-flex">
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-10 w-full md:w-auto appearance-none rounded-md border border-input bg-background pl-3 pr-10 py-2 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">All Categories</option>
                <option value="Governance">Governance</option>
                <option value="Anti-Corruption">Anti-Corruption</option>
                <option value="Education">Education</option>
                <option value="Economy">Economy</option>
                <option value="Health">Health</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-md p-5 animate-pulse">
                <div className="flex gap-2 mb-3"><div className="h-5 w-16 bg-muted rounded" /><div className="h-5 w-20 bg-muted rounded" /></div>
                <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-full mb-1" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <StaggerList className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((promise) => (
              <PromiseCard
                key={promise.id}
                id={promise.id}
                slug={promise.slug}
                title={promise.title}
                description={promise.description ?? ""}
                category={promise.category}
                status={dbStatusToFrontend(promise.status)}
                source={promise.source ?? ""}
                confidence={promise.confidence as "VERIFIED" | "SCRAPED" | "MANUAL"}
                evidenceUrl={promise.evidenceUrl ?? undefined}
              />
            ))}
          </StaggerList>
        ) : (
          <div className="text-center py-12 text-muted-foreground">No promises found matching your filters.</div>
        )}
      </div>
    </PageTransition>
  )
}
