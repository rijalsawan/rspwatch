"use client"

import { PageTransition } from "@/components/animations/PageTransition"
import { StaggerList } from "@/components/animations/StaggerList"
import { FilterBar } from "@/components/shared/FilterBar"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Users, Check, X, Minus, Info } from "lucide-react"

interface VoteRecord {
  id: string
  date: string
  billTitle: string
  billId: string
  type: "Final Passage" | "Amendment" | "Procedural"
  outcome: "Passed" | "Defeated"
  breakdown: {
    yea: number
    nay: number
    abstain: number
    absent: number
  }
  partyLine: boolean
  defectors?: number
}

const SAMPLE_VOTES: VoteRecord[] = [
  {
    id: "vote-042",
    date: "March 12, 2026",
    billTitle: "Foreign Direct Investment Moderation Act",
    billId: "BILL-2026-10",
    type: "Final Passage",
    outcome: "Passed",
    breakdown: { yea: 182, nay: 0, abstain: 0, absent: 0 },
    partyLine: true
  },
  {
    id: "vote-041",
    date: "March 10, 2026",
    billTitle: "Comprehensive Anti-Corruption & Assets Declaration Act",
    billId: "BILL-2026-04",
    type: "Final Passage",
    outcome: "Passed",
    breakdown: { yea: 180, nay: 0, abstain: 0, absent: 2 },
    partyLine: true
  },
  {
    id: "vote-040",
    date: "Feb 28, 2026",
    billTitle: "Amendment 12: Digital Identity Data Retention Limit",
    billId: "AMND-12",
    type: "Amendment",
    outcome: "Defeated",
    breakdown: { yea: 45, nay: 130, abstain: 5, absent: 2 },
    partyLine: false,
    defectors: 45
  },
  {
    id: "vote-039",
    date: "Feb 15, 2026",
    billTitle: "Startup & Innovation Tax Relief Bill",
    billId: "BILL-2026-02",
    type: "Final Passage",
    outcome: "Passed",
    breakdown: { yea: 181, nay: 0, abstain: 0, absent: 1 },
    partyLine: true
  }
]

export default function VotesPage() {
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
      <FilterBar />

      {/* Votes Data List */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between text-sm font-medium text-muted-foreground px-2">
          <span>{SAMPLE_VOTES.length} roll calls found</span>
          <span className="hidden sm:inline">Sort by: Most Recent</span>
        </div>

        <StaggerList className="flex flex-col gap-4">
          {SAMPLE_VOTES.map((vote) => (
            <div 
              key={vote.id} 
              className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-5 md:p-6 border border-border bg-card rounded-md hover:border-primary/50 transition-colors"
            >
              
              {/* Left Column: Bill & Info */}
              <div className="flex flex-col gap-3 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1 text-xs">
                  <span className="font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">
                    {vote.billId}
                  </span>
                  <span className="text-muted-foreground font-medium">
                    {vote.date}
                  </span>
                  <StatusBadge status="neutral" className="ml-2">
                    {vote.type}
                  </StatusBadge>
                  {vote.partyLine ? (
                    <StatusBadge status="success" className="ml-auto lg:ml-2">
                      Party Line Vote
                    </StatusBadge>
                  ) : (
                    <StatusBadge status="warning" className="ml-auto lg:ml-2">
                      {vote.defectors} Defections
                    </StatusBadge>
                  )}
                </div>
                
                <h2 className="text-xl font-semibold leading-tight pr-4">
                  {vote.billTitle}
                </h2>
                
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-sm font-medium text-muted-foreground">Overall Result:</span>
                  <StatusBadge status={vote.outcome === "Passed" ? "success" : "destructive"}>
                    {vote.outcome}
                  </StatusBadge>
                </div>
              </div>

              {/* Right Column: Vote Breakdown Visualization */}
              <div className="flex flex-col gap-3 lg:w-96 shrink-0 pt-4 lg:pt-0 border-t border-border lg:border-0">
                <div className="flex justify-between items-end mb-1">
                  <div className="flex items-center gap-1.5 text-sm font-semibold">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>RSP Bloc Breakdown</span>
                  </div>
                  <span className="text-xs text-muted-foreground">182 Total Seats</span>
                </div>

                {/* Flat Stacked Bar */}
                <div className="flex h-4 w-full rounded-sm overflow-hidden bg-muted">
                  {vote.breakdown.yea > 0 && <div className="bg-success h-full" style={{ width: `${(vote.breakdown.yea / 182) * 100}%` }} />}
                  {vote.breakdown.nay > 0 && <div className="bg-destructive h-full" style={{ width: `${(vote.breakdown.nay / 182) * 100}%` }} />}
                  {vote.breakdown.abstain > 0 && <div className="bg-warning h-full" style={{ width: `${(vote.breakdown.abstain / 182) * 100}%` }} />}
                  {vote.breakdown.absent > 0 && <div className="bg-secondary h-full border-l border-border" style={{ width: `${(vote.breakdown.absent / 182) * 100}%` }} />}
                </div>

                {/* Legend / Stats */}
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1 text-muted-foreground"><Check className="w-3 h-3 text-success"/> Yea</span>
                    <span className="font-semibold text-lg">{vote.breakdown.yea}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1 text-muted-foreground"><X className="w-3 h-3 text-destructive"/> Nay</span>
                    <span className="font-semibold text-lg">{vote.breakdown.nay}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1 text-muted-foreground"><Minus className="w-3 h-3 text-warning"/> Abstain</span>
                    <span className="font-semibold text-lg">{vote.breakdown.abstain}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1 text-muted-foreground"><Info className="w-3 h-3"/> Absent</span>
                    <span className="font-semibold text-lg">{vote.breakdown.absent}</span>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </StaggerList>
      </div>
    </PageTransition>
  )
}
