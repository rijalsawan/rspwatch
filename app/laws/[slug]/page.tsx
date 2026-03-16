"use client"

import { useEffect, useState } from "react"
import { PageTransition } from "@/components/animations/PageTransition"
import { StatusBadge } from "@/components/shared/StatusBadge"
import type { StatusType } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink, Users, Scale, FileText, CheckCircle2, History, X } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

interface LawDetail {
  slug: string
  title: string
  titleNepali: string | null
  code: string
  status: string
  category: string
  summary: string | null
  fullText: string | null
  sourceUrl: string | null
  proposedDate: string
  passedDate: string | null
  enactedDate: string | null
  proposedBy: { id: string; slug: string; name: string } | null
  tags: { name: string }[]
}

interface VoteBreakdown {
  id: string
  date: string
  type: string
  outcome: string
  description: string
  breakdown: { yea: number; nay: number; abstain: number; absent: number }
  memberVotes: { memberName: string; memberSlug: string; choice: string }[]
}

interface RelatedStatement {
  id: string
  title: string
  content: string | null
  date: string
  member: { name: string; slug: string } | null
}

function lawStatusToDisplay(status: string): StatusType {
  const map: Record<string, StatusType> = { PASSED: "success", ENACTED: "success", PROPOSED: "warning", COMMITTEE: "warning", DRAFT: "pending", REJECTED: "destructive" }
  return map[status] ?? "neutral"
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

export default function LawDetailPage() {
  const { slug } = useParams()
  const slugStr = typeof slug === "string" ? slug : (slug?.[0] ?? "")

  const [law, setLaw] = useState<LawDetail | null>(null)
  const [votes, setVotes] = useState<VoteBreakdown[]>([])
  const [statements, setStatements] = useState<RelatedStatement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slugStr) return
    async function load() {
      try {
        const res = await fetch(`/api/laws/${slugStr}`)
        const json = await res.json()
        if (json.error) { setError(json.error); return }
        if (json.data) {
          setLaw(json.data.law)
          setVotes(json.data.votes ?? [])
          setStatements(json.data.relatedStatements ?? [])
        }
      } catch { setError("Failed to load law details") }
      finally { setLoading(false) }
    }
    load()
  }, [slugStr])

  if (loading) {
    return (
      <PageTransition className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-10 w-full">
        <div className="animate-pulse space-y-6">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="flex gap-2"><div className="h-5 w-16 bg-muted rounded" /><div className="h-5 w-24 bg-muted rounded" /></div>
          <div className="h-10 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </div>
      </PageTransition>
    )
  }

  if (error || !law) {
    return (
      <PageTransition className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-10 w-full">
        <Link href="/laws" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Laws & Bills
        </Link>
        <div className="bg-destructive/5 border border-destructive/20 rounded-md p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Law Not Found</h2>
          <p className="text-muted-foreground">{error ?? "This law could not be found."}</p>
        </div>
      </PageTransition>
    )
  }

  // Timeline milestones
  const timeline: { label: string; date: string | null; isCurrent: boolean }[] = []
  if (law.enactedDate) timeline.push({ label: "Enacted Into Law", date: law.enactedDate, isCurrent: law.status === "ENACTED" })
  if (law.passedDate) timeline.push({ label: "Passed Parliament Vote", date: law.passedDate, isCurrent: law.status === "PASSED" })
  timeline.push({ label: "Introduced to Floor", date: law.proposedDate, isCurrent: law.status === "PROPOSED" || law.status === "COMMITTEE" || law.status === "DRAFT" })

  const latestVote = votes[0]

  return (
    <PageTransition className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-10 w-full">

      {/* Breadcrumbs & Metadata Header */}
      <div className="flex flex-col gap-6">
        <Link href="/laws" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors w-fit outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Laws & Bills
        </Link>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={lawStatusToDisplay(law.status)}>{law.status}</StatusBadge>
            <span className="text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-sm flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> {law.code}
            </span>
            <StatusBadge status="neutral">{law.category}</StatusBadge>
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-bold leading-tight">{law.title}</h1>
          {law.titleNepali && <p className="text-lg text-muted-foreground">{law.titleNepali}</p>}

          <p className="text-lg text-muted-foreground max-w-4xl leading-relaxed">{law.summary}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 flex flex-col gap-10">

          {/* Timeline Milestones */}
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
              <History className="w-5 h-5 text-muted-foreground" /> Legislative Timeline
            </h2>
            <div className="flex flex-col gap-4 bg-card border border-border rounded-md p-5 md:p-6">
              {timeline.map((step, i) => (
                <div key={step.label}>
                  <div className="flex items-start gap-4">
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${step.isCurrent ? "bg-primary" : "bg-muted-foreground"}`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold">{step.label}</span>
                        <span className="text-sm text-muted-foreground">{step.date ? formatDate(step.date) : "Pending"}</span>
                      </div>
                    </div>
                  </div>
                  {i < timeline.length - 1 && <div className="w-px h-6 bg-border ml-1 my-[-8px]" />}
                </div>
              ))}
            </div>
          </section>

          {/* Full Text / Key Provisions */}
          {law.fullText && (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
                <Scale className="w-5 h-5 text-muted-foreground" /> Key Provisions & Impact
              </h2>
              <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground text-base leading-loose">
                <p>{law.fullText}</p>
              </div>
            </section>
          )}

          {/* Vote Breakdown Details */}
          {votes.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
                <Users className="w-5 h-5 text-muted-foreground" /> Vote Records
              </h2>
              {votes.map((vote) => {
                const total = vote.breakdown.yea + vote.breakdown.nay + vote.breakdown.abstain + vote.breakdown.absent
                return (
                  <div key={vote.id} className="bg-card border border-border rounded-md p-5">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <StatusBadge status={vote.outcome === "PASSED" ? "success" : "destructive"}>{vote.outcome}</StatusBadge>
                      <span className="text-sm text-muted-foreground">{formatDate(vote.date)}</span>
                      <StatusBadge status="neutral">{vote.type.replace("_", " ")}</StatusBadge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{vote.description}</p>
                    {/* Stacked bar */}
                    <div className="flex h-3 w-full rounded-sm overflow-hidden bg-muted mb-2">
                      {vote.breakdown.yea > 0 && <div className="bg-success h-full" style={{ width: `${(vote.breakdown.yea / total) * 100}%` }} />}
                      {vote.breakdown.nay > 0 && <div className="bg-destructive h-full" style={{ width: `${(vote.breakdown.nay / total) * 100}%` }} />}
                      {vote.breakdown.abstain > 0 && <div className="bg-warning h-full" style={{ width: `${(vote.breakdown.abstain / total) * 100}%` }} />}
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                      <span>Yea: <strong className="text-foreground">{vote.breakdown.yea}</strong></span>
                      <span>Nay: <strong className="text-foreground">{vote.breakdown.nay}</strong></span>
                      <span>Abstain: <strong className="text-foreground">{vote.breakdown.abstain}</strong></span>
                      <span>Absent: <strong className="text-foreground">{vote.breakdown.absent}</strong></span>
                    </div>
                  </div>
                )
              })}
            </section>
          )}

          {law.sourceUrl && (
            <div>
              <Button variant="outline" className="gap-2" asChild>
                <a href={law.sourceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" /> View Original Source
                </a>
              </Button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-card border border-border rounded-md p-6 flex flex-col gap-5 sticky top-[88px]">
            <h3 className="font-display font-bold text-lg border-b border-border pb-2">Sponsorship</h3>

            {law.proposedBy ? (
              <Link href={`/members/${law.proposedBy.slug}`} className="flex items-center gap-3 hover:bg-secondary/50 p-2 -m-2 rounded-md transition-colors">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border border-border">
                  <Users className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold">{law.proposedBy.name}</span>
                  <span className="text-xs text-muted-foreground">Primary Sponsor</span>
                </div>
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">No sponsor information</span>
            )}

            <h3 className="font-display font-bold text-lg border-b border-border pb-2 mt-2">RSP Voting Record</h3>

            {latestVote ? (
              <>
                <div className="flex items-center gap-2">
                  {latestVote.outcome === "PASSED" ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <X className="w-5 h-5 text-destructive" />
                  )}
                  <span className={`font-semibold ${latestVote.outcome === "PASSED" ? "text-success" : "text-destructive"}`}>
                    {latestVote.breakdown.yea > 0 && latestVote.breakdown.nay === 0
                      ? `Unanimous Yea (${latestVote.breakdown.yea})`
                      : `${latestVote.breakdown.yea} Yea / ${latestVote.breakdown.nay} Nay`}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {latestVote.description}
                </div>
                <Link href="/votes" className="text-sm font-medium text-primary hover:underline mt-2 inline-block w-fit">
                  View Full Roll Call
                </Link>
              </>
            ) : (
              <div className="text-sm text-muted-foreground flex flex-col gap-2">
                <span className="flex items-center gap-2 p-3 bg-muted/50 rounded-sm">
                  Awaiting vote placement.
                </span>
              </div>
            )}

            {law.tags.length > 0 && (
              <>
                <h3 className="font-display font-bold text-lg border-b border-border pb-2 mt-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {law.tags.map((tag) => (
                    <StatusBadge key={tag.name} status="neutral">{tag.name}</StatusBadge>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </PageTransition>
  )
}
