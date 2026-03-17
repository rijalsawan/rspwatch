"use client"

import { useState, useMemo } from "react"
import { useCachedFetch } from "@/hooks/use-cached-fetch"
import { PageTransition } from "@/components/animations/PageTransition"
import { StaggerList } from "@/components/animations/StaggerList"
import { AnimatedProgress } from "@/components/animations/AnimatedProgress"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Input } from "@/components/ui/input"
import { Users, Check, X, Minus, Info, Search } from "lucide-react"

interface VoteRecord {
  id: string
  date: string
  type: string
  outcome: string
  description: string
  law: { slug: string; title: string; code: string } | null
  breakdown: { yea: number; nay: number; abstain: number; absent: number }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

export default function VotesPage() {
  const [search, setSearch] = useState("")

  // Construct the API URL
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({ limit: "50" })
    return `/api/votes?${params}`
  }, [])

  // Use cached fetch
  const { data: votesResponse, loading } = useCachedFetch<{data: VoteRecord[], meta?: {total: number}}>(apiUrl)

  // Extract data from response
  const votes = votesResponse?.data ?? []
  const total = votesResponse?.meta?.total ?? votes.length

  const filtered = search
    ? votes.filter(v => {
        const q = search.toLowerCase()
        return v.description.toLowerCase().includes(q) || (v.law?.title ?? "").toLowerCase().includes(q)
      })
    : votes

  return (
    <PageTransition className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-10 w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 max-w-3xl">
        <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
          Parliamentary Votes
        </h1>
        <p className="text-lg text-muted-foreground">
          A definitive record of how RSP lawmakers have voted on the parliament floor.
          Monitor party discipline, individual defections, and attendance during critical legislation.
        </p>
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-card border border-border rounded-md">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search votes..." className="pl-9 bg-background" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Votes Data List */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between text-sm font-medium text-muted-foreground px-2">
          <span>{filtered.length} roll calls found</span>
          <span className="hidden sm:inline">Sort by: Most Recent</span>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-card border border-border rounded-md p-6">
                <div className="flex gap-2 mb-3"><div className="h-5 w-20 bg-muted rounded" /><div className="h-5 w-16 bg-muted rounded" /></div>
                <div className="h-6 bg-muted rounded w-2/3 mb-2" />
                <div className="h-4 bg-muted rounded-sm w-full mt-4" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <StaggerList className="flex flex-col gap-4">
            {filtered.map((vote) => {
              const totalVoters = vote.breakdown.yea + vote.breakdown.nay + vote.breakdown.abstain + vote.breakdown.absent
              const isPartyLine = vote.breakdown.nay === 0 && vote.breakdown.abstain === 0
              const defectors = !isPartyLine ? vote.breakdown.nay + vote.breakdown.abstain : 0

              return (
                <div
                  key={vote.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-5 md:p-6 border border-border bg-card rounded-md hover:border-primary/50 transition-colors"
                >
                  {/* Left Column: Bill & Info */}
                  <div className="flex flex-col gap-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1 text-xs">
                      {vote.law && (
                        <span className="font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">{vote.law.code}</span>
                      )}
                      <span className="text-muted-foreground font-medium">{formatDate(vote.date)}</span>
                      <StatusBadge status="neutral" className="ml-2">{vote.type.replace("_", " ")}</StatusBadge>
                      {isPartyLine ? (
                        <StatusBadge status="success" className="ml-auto lg:ml-2">Party Line Vote</StatusBadge>
                      ) : (
                        <StatusBadge status="warning" className="ml-auto lg:ml-2">{defectors} Defections</StatusBadge>
                      )}
                    </div>

                    <h2 className="text-xl font-semibold leading-tight pr-4">
                      {vote.law?.title ?? vote.description}
                    </h2>

                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-sm font-medium text-muted-foreground">Overall Result:</span>
                      <StatusBadge status={vote.outcome === "PASSED" ? "success" : "destructive"}>
                        {vote.outcome}
                      </StatusBadge>
                    </div>
                  </div>

                  {/* Right Column: Vote Breakdown */}
                  <div className="flex flex-col gap-3 lg:w-96 shrink-0 pt-4 lg:pt-0 border-t border-border lg:border-0">
                    <div className="flex justify-between items-end mb-1">
                      <div className="flex items-center gap-1.5 text-sm font-semibold">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>RSP Bloc Breakdown</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{totalVoters} Total Votes</span>
                    </div>

                    {/* Stacked Bar */}
                    <div className="flex h-4 w-full rounded-sm overflow-hidden bg-muted">
                        {vote.breakdown.yea > 0 && <AnimatedProgress className="bg-success h-full" value={(vote.breakdown.yea / totalVoters) * 100} delay={0.1} />}
                        {vote.breakdown.nay > 0 && <AnimatedProgress className="bg-destructive h-full" value={(vote.breakdown.nay / totalVoters) * 100} delay={0.2} />}
                        {vote.breakdown.abstain > 0 && <AnimatedProgress className="bg-warning h-full" value={(vote.breakdown.abstain / totalVoters) * 100} delay={0.3} />}
                        {vote.breakdown.absent > 0 && <AnimatedProgress className="bg-secondary h-full border-l border-border" value={(vote.breakdown.absent / totalVoters) * 100} delay={0.4} />}
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1 text-muted-foreground"><Check className="w-3 h-3 text-success" /> Yea</span>
                        <span className="font-semibold text-lg">{vote.breakdown.yea}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1 text-muted-foreground"><X className="w-3 h-3 text-destructive" /> Nay</span>
                        <span className="font-semibold text-lg">{vote.breakdown.nay}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1 text-muted-foreground"><Minus className="w-3 h-3 text-warning" /> Abstain</span>
                        <span className="font-semibold text-lg">{vote.breakdown.abstain}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1 text-muted-foreground"><Info className="w-3 h-3" /> Absent</span>
                        <span className="font-semibold text-lg">{vote.breakdown.absent}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </StaggerList>
        ) : (
          <div className="text-center py-12 text-muted-foreground">No votes found.</div>
        )}
      </div>
    </PageTransition>
  )
}
