"use client"

import { useEffect, useState } from "react"
import { PageTransition } from "@/components/animations/PageTransition"
import { StaggerList } from "@/components/animations/StaggerList"
import { StatusBadge } from "@/components/shared/StatusBadge"
import type { StatusType } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, ArrowRight, Search } from "lucide-react"
import Link from "next/link"

interface LawData {
  id: string
  slug: string
  title: string
  code: string
  status: string
  category: string
  summary: string | null
  proposedDate: string
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
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

export default function LawsPage() {
  const [laws, setLaws] = useState<LawData[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const params = new URLSearchParams({ limit: "50" })
        if (statusFilter) params.set("status", statusFilter)
        if (categoryFilter) params.set("category", categoryFilter)
        const res = await fetch(`/api/laws?${params}`)
        const json = await res.json()
        if (json.data) {
          setLaws(json.data)
          setTotal(json.meta?.total ?? json.data.length)
        }
      } catch (e) {
        console.error("Failed to load laws:", e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [statusFilter, categoryFilter])

  const filtered = search
    ? laws.filter(l => l.title.toLowerCase().includes(search.toLowerCase()) || l.category.toLowerCase().includes(search.toLowerCase()))
    : laws

  return (
    <PageTransition className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-8 w-full">
      {/* Header Section */}
      <div className="flex flex-col gap-4 max-w-3xl">
        <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
          Laws & Bills
        </h1>
        <p className="text-lg text-muted-foreground">
          Track every piece of legislation proposed, debated, or voted on by RSP lawmakers.
          Monitor their commitments to the Citizen Contract in real-time.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-card border border-border rounded-md">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search laws..." className="pl-9 bg-background" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-3">
          <div className="relative inline-flex">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 w-full md:w-auto appearance-none rounded-md border border-input bg-background pl-3 pr-10 py-2 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PROPOSED">Proposed</option>
              <option value="COMMITTEE">Committee</option>
              <option value="PASSED">Passed</option>
              <option value="REJECTED">Rejected</option>
              <option value="ENACTED">Enacted</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          <div className="relative inline-flex">
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-10 w-full md:w-auto appearance-none rounded-md border border-input bg-background pl-3 pr-10 py-2 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">All Categories</option>
              <option value="Anti-Corruption">Anti-Corruption</option>
              <option value="Education">Education</option>
              <option value="Economy">Economy</option>
              <option value="Governance">Governance</option>
              <option value="Health">Health</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Data List */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between text-sm font-medium text-muted-foreground px-2">
          <span>{filtered.length} items found</span>
          <span className="hidden sm:inline">Sort by: Newest First</span>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-card border border-border rounded-md p-6">
                <div className="flex gap-2 mb-3"><div className="h-5 w-16 bg-muted rounded" /><div className="h-5 w-20 bg-muted rounded" /></div>
                <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <StaggerList className="flex flex-col gap-4">
            {filtered.map((law) => (
              <div
                key={law.id}
                className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 p-5 sm:p-6 border border-border bg-card rounded-md hover:border-primary/50 transition-colors group"
              >
                {/* Left Content */}
                <div className="flex flex-col gap-3 flex-1 w-full max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={lawStatusToDisplay(law.status)}>{law.status}</StatusBadge>
                    <StatusBadge status="neutral">{law.category}</StatusBadge>
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">{law.code}</span>
                  </div>

                  <Link href={`/laws/${law.slug}`} className="outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm w-fit">
                    <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">{law.title}</h2>
                  </Link>

                  <p className="text-muted-foreground text-sm line-clamp-2 md:line-clamp-none">{law.summary}</p>
                </div>

                {/* Right Content / Metadata */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-4 pt-4 sm:pt-0 border-t border-border sm:border-0 w-full sm:w-auto shrink-0">
                  <div className="flex flex-col sm:items-end gap-1">
                    <span className="text-xs text-muted-foreground">Proposed date</span>
                    <span className="text-sm font-medium">{formatDate(law.proposedDate)}</span>
                    {law.proposedBy && (
                      <span className="text-xs text-muted-foreground mt-1 hidden sm:inline">
                        Sponsor: <span className="font-medium text-foreground">{law.proposedBy.name}</span>
                      </span>
                    )}
                  </div>

                  <Button asChild variant="outline" className="w-full sm:w-auto mt-auto group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">
                    <Link href={`/laws/${law.slug}`} className="gap-2">
                      <FileText className="w-4 h-4" /> Read Bill
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </StaggerList>
        ) : (
          <div className="text-center py-12 text-muted-foreground">No laws found matching your filters.</div>
        )}
      </div>
    </PageTransition>
  )
}
