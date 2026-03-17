"use client"

import { useState, useMemo, useEffect } from "react"
import { PageTransition } from "@/components/animations/PageTransition"
import { StaggerList } from "@/components/animations/StaggerList"
import { StatusBadge } from "@/components/shared/StatusBadge"
import type { StatusType } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, ArrowRight, Search, Users, Calendar, Tag, BadgeCheck, Loader2 } from "lucide-react"
import Link from "next/link"

const PAGE_SIZE = 50

interface LawData {
  id: string
  slug: string
  title: string
  titleNepali: string | null
  code: string | null
  status: string
  category: string
  summary: string | null
  proposedDate: string | null
  confidence: string
  proposedBy: { name: string; slug: string } | null
  tags: { name: string }[]
}

function lawStatusToDisplay(status: string): StatusType {
  const map: Record<string, StatusType> = {
    PASSED: "success",
    ENACTED: "success",
    PROPOSED: "warning",
    COMMITTEE: "warning",
    DRAFT: "pending",
    REJECTED: "destructive",
  }
  return map[status] ?? "neutral"
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function LawsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")

  const [allLaws, setAllLaws] = useState<LawData[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Fetch initial page when filters change
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setAllLaws([])
    setPage(1)
    setHasMore(false)

    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      page: "1",
    })
    if (statusFilter) params.set("status", statusFilter)
    if (categoryFilter) params.set("category", categoryFilter)

    fetch(`/api/laws?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return
        setAllLaws(res.data ?? [])
        setHasMore(res.meta?.hasMore ?? false)
      })
      .catch(() => { if (!cancelled) setAllLaws([]) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [statusFilter, categoryFilter])

  const loadMore = async () => {
    setLoadingMore(true)
    const nextPage = page + 1
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        page: String(nextPage),
      })
      if (statusFilter) params.set("status", statusFilter)
      if (categoryFilter) params.set("category", categoryFilter)

      const res = await fetch(`/api/laws?${params}`)
      const data = await res.json()
      setAllLaws((prev) => [...prev, ...(data.data ?? [])])
      setHasMore(data.meta?.hasMore ?? false)
      setPage(nextPage)
    } finally {
      setLoadingMore(false)
    }
  }

  // Client-side search filter on the already-loaded set
  const filtered = search
    ? allLaws.filter((l) =>
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        (l.titleNepali && l.titleNepali.includes(search)) ||
        (l.code && l.code.toLowerCase().includes(search.toLowerCase())) ||
        l.category.toLowerCase().includes(search.toLowerCase())
      )
    : allLaws

  return (
    <PageTransition className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-8 w-full">
      {/* Header Section */}
      <div className="flex flex-col gap-4 max-w-3xl">
        <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
          Laws & Bills
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Track every piece of legislation proposed, debated, or voted on by Nepali parliamentarians. Monitor parliamentary commitments in real-time, including official texts, committee statuses, and debate records.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-4 bg-card border border-border rounded-md shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by title, code, or nepali name..." className="pl-9 bg-background font-medium" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative inline-flex">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 w-full md:w-40 appearance-none rounded-md border border-input bg-background font-medium pl-3 pr-10 py-2 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PROPOSED">Proposed</option>
              <option value="COMMITTEE">Committee</option>
              <option value="PASSED">Passed</option>
              <option value="REJECTED">Rejected</option>
              <option value="ENACTED">Enacted</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          <div className="relative inline-flex">
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-10 w-full md:w-44 appearance-none rounded-md border border-input bg-background font-medium pl-3 pr-10 py-2 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">All Categories</option>
              <option value="Anti-Corruption">Anti-Corruption</option>
              <option value="Education">Education</option>
              <option value="Economy">Economy</option>
              <option value="Governance">Governance</option>
              <option value="Health">Health</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Data List */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between text-sm font-medium text-muted-foreground px-2">
          <span>Displaying {filtered.length} {filtered.length === 1 ? 'bill' : 'bills'}</span>
          <span className="hidden sm:inline">Sort by: Newest First</span>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-card border border-border rounded-md p-6 h-[200px] flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2"><div className="h-5 w-20 bg-muted rounded" /><div className="h-5 w-24 bg-muted rounded" /></div>
                  <div className="h-7 bg-muted rounded w-2/3" />
                  <div className="h-4 bg-muted rounded w-full mt-2" />
                </div>
                <div className="h-10 border-t border-border mt-4 flex items-center justify-between pt-4">
                   <div className="h-4 w-1/3 bg-muted rounded"></div>
                   <div className="h-8 w-24 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <StaggerList className="flex flex-col gap-5">
            {filtered.map((law) => (
              <div
                key={law.id}
                className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-5 sm:p-6 border border-border bg-card rounded-md hover:border-primary/40 hover:shadow-sm transition-all duration-300 group"
              >
                {/* Document Icon for Professional styling instead of color bars */}
                <div className="hidden sm:flex w-12 h-12 rounded-lg bg-muted/30 border border-border items-center justify-center shrink-0 group-hover:bg-primary/5 group-hover:border-primary/20 transition-colors">
                  <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                
                <div className="flex flex-col flex-1 w-full min-w-0">
                  {/* Header & Status */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={lawStatusToDisplay(law.status)}>{law.status}</StatusBadge>
                      <StatusBadge status="neutral">{law.category}</StatusBadge>
                      {law.code && (
                        <span className="text-xs font-mono font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-sm flex items-center gap-1 border border-border/50">
                          <FileText className="w-3 h-3"/>
                          {law.code}
                        </span>
                      )}
                    </div>
                    
                    {law.confidence === "VERIFIED" && (
                      <div className="flex items-center gap-1 text-[11px] font-bold tracking-wider uppercase text-success bg-success/10 px-2 py-1 rounded-sm shrink-0">
                        <BadgeCheck className="w-3.5 h-3.5" /> Verified
                      </div>
                    )}
                  </div>

                  {/* Titles & Summary */}
                  <div className="flex flex-col gap-1.5 mb-5">
                    <Link href={`/laws/${law.slug}`} className="outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm w-fit">
                      <h2 className="text-xl md:text-2xl font-bold font-display group-hover:text-primary transition-colors leading-tight">
                        {law.title}
                      </h2>
                    </Link>
                    {law.titleNepali && (
                      <h3 className="text-sm font-medium text-muted-foreground font-display">
                        {law.titleNepali}
                      </h3>
                    )}
                    {law.summary && (
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mt-2">
                        {law.summary}
                      </p>
                    )}
                  </div>

                  {/* Footer Metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border mt-auto">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-muted-foreground">
                      {law.proposedDate && (
                        <span className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-4 h-4 text-primary/70" /> 
                          Proposed <span className="text-foreground">{formatDate(law.proposedDate)}</span>
                      </span>
                    )}
                    {law.proposedBy && (
                      <span className="flex items-center gap-1.5 font-medium">
                        <Users className="w-4 h-4 text-primary/70" /> 
                        Sponsor: 
                        <Link href={`/members/${law.proposedBy.slug}`} className="text-foreground hover:text-primary transition-colors underline decoration-border underline-offset-2 ml-0.5">
                          {law.proposedBy.name}
                        </Link>
                      </span>
                    )}
                    {law.tags && law.tags.length > 0 && (
                      <span className="flex items-center gap-1.5 font-medium">
                        <Tag className="w-4 h-4 text-primary/70" /> 
                        {law.tags.slice(0, 2).map(t => t.name).join(", ")}
                        {law.tags.length > 2 && <span className="ml-1 text-[10px] bg-muted px-1.5 rounded-sm">+{law.tags.length - 2}</span>}
                      </span>
                    )}
                  </div>

                  <Button asChild variant="secondary" size="sm" className="ml-auto w-full sm:w-auto hover:bg-primary hover:text-primary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <Link href={`/laws/${law.slug}`} className="gap-2 font-semibold">
                      Read Details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>
                </div>
              </div>
            ))}
          </StaggerList>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-card border border-border border-dashed rounded-md">
            <FileText className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-1">No legislative records found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">We couldn't find any bills matching your current filters and search terms.</p>
            {(search || statusFilter || categoryFilter) && (
              <Button variant="outline" className="mt-6" onClick={() => { setSearch(""); setStatusFilter(""); setCategoryFilter(""); }}>
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
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
              "Load More Bills"
            )}
          </button>
        )}
      </div>
    </PageTransition>
  )
}
