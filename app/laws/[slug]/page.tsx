"use client"

import { useCachedFetch } from "@/hooks/use-cached-fetch"
import { PageTransition } from "@/components/animations/PageTransition"
import { AnimatedProgress } from "@/components/animations/AnimatedProgress"
import { GlitchNumber } from "@/components/animations/GlitchNumber"
import { StatusBadge } from "@/components/shared/StatusBadge"
import type { StatusType } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink, Users, Scale, FileText, CheckCircle2, History, BadgeCheck, Tag, Info, Calendar } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

interface LawDetail {
  slug: string
  title: string
  titleNepali: string | null
  code: string | null
  status: string
  category: string
  summary: string | null
  fullText: string | null
  sourceUrl: string | null
  proposedDate: string | null
  passedDate: string | null
  enactedDate: string | null
  confidence: string
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
  memberVotes: {
    memberName: string
    memberSlug: string
    choice: string
    party: { abbreviation: string; color: string | null } | null
  }[]
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

interface LawDetailResponse {
  data: {
    law: LawDetail
    votes: VoteBreakdown[]
    relatedStatements: RelatedStatement[]
  }
  error?: string
}

export default function LawDetailPage() {
  const { slug } = useParams()
  const slugStr = typeof slug === "string" ? slug : (slug?.[0] ?? "")

  // Use cached fetch for law detail
  const { data: lawResponse, loading, error } = useCachedFetch<LawDetailResponse>(
    slugStr ? `/api/laws/${slugStr}` : null
  )

  const law = lawResponse?.data?.law ?? null
  const votes = lawResponse?.data?.votes ?? []
  const statements = lawResponse?.data?.relatedStatements ?? []
  const errorMsg = lawResponse?.error ?? (error ? "Failed to load law details" : null)

  if (loading) {
    return (
      <PageTransition className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-10 w-full min-h-[70vh]">
        <div className="animate-pulse space-y-6">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="flex gap-2"><div className="h-6 w-20 bg-muted rounded" /><div className="h-6 w-24 bg-muted rounded" /></div>
          <div className="h-12 bg-muted rounded w-3/4 max-w-2xl" />
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-24 bg-muted rounded w-full mt-8" />
        </div>
      </PageTransition>
    )
  }

  if (errorMsg || !law) {
    return (
      <PageTransition className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-10 w-full min-h-[70vh]">
        <Link href="/laws" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Laws & Bills
        </Link>
        <div className="bg-destructive/5 border border-destructive/20 rounded-md p-12 text-center flex flex-col items-center">
          <Info className="w-12 h-12 text-destructive mb-4 opacity-80" />
          <h2 className="text-2xl font-bold mb-2">Record Not Found</h2>
          <p className="text-muted-foreground">{error ?? "This legislative record could not be located in our database."}</p>
        </div>
      </PageTransition>
    )
  }

  // Timeline milestones
  const timeline: { label: string; date: string | null; isCurrent: boolean }[] = []
  if (law.enactedDate) timeline.push({ label: "Enacted Into Law", date: law.enactedDate, isCurrent: law.status === "ENACTED" })
  if (law.passedDate) timeline.push({ label: "Passed Parliament Vote", date: law.passedDate, isCurrent: law.status === "PASSED" })
  timeline.push({ label: "Introduced to Floor", date: law.proposedDate, isCurrent: ["PROPOSED", "COMMITTEE", "DRAFT"].includes(law.status) })

  return (
    <PageTransition className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-10 w-full">

      {/* Breadcrumbs */}
      <Link href="/laws" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors w-fit outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Laws & Bills
      </Link>

      {/* Hero Section */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={lawStatusToDisplay(law.status)}>{law.status}</StatusBadge>
          <StatusBadge status="neutral">{law.category}</StatusBadge>
          {law.code && (
            <span className="text-sm font-mono font-medium text-muted-foreground bg-muted/60 border border-border px-2 py-0.5 rounded-sm flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> {law.code}
            </span>
          )}
          {law.confidence === "VERIFIED" && (
            <span className="flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase text-success bg-success/10 px-2.5 py-1 rounded-sm">
              <BadgeCheck className="w-4 h-4" /> Verified Data
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-3xl md:text-5xl font-display font-bold leading-tight tracking-tight text-foreground">
            {law.title}
          </h1>
          {law.titleNepali && (
            <h2 className="text-xl md:text-2xl font-medium text-muted-foreground font-display">
              {law.titleNepali}
            </h2>
          )}
        </div>

        {law.summary && (
          <div className="bg-muted/30 border border-border p-6 rounded-md">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" /> Executive Summary
            </h3>
            <p className="text-lg text-foreground leading-relaxed">
              {law.summary}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mt-2">
        {/* LEFT COLUMN: Main Content */}
        <div className="lg:col-span-8 flex flex-col gap-12">

          {/* Full Text / Key Provisions */}
          {law.fullText && (
            <section className="flex flex-col gap-5">
              <h2 className="text-2xl font-display font-bold flex items-center gap-2 border-b border-border pb-3">
                <Scale className="w-6 h-6 text-primary" /> Key Provisions & Impact
              </h2>
              <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground text-base leading-loose whitespace-pre-wrap">
                {law.fullText}
              </div>
            </section>
          )}

          {/* Vote Breakdown Details */}
          {votes.length > 0 && (
            <section className="flex flex-col gap-5">
              <h2 className="text-2xl font-display font-bold flex items-center gap-2 border-b border-border pb-3">
                <Users className="w-6 h-6 text-primary" /> Vote Records
              </h2>
              <div className="flex flex-col gap-4">
                {votes.map((vote) => (
                  <div key={vote.id} className="bg-card border border-border rounded-md p-6 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start mb-4 gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <StatusBadge status={vote.outcome === "PASSED" ? "success" : "destructive"}>{vote.outcome}</StatusBadge>
                          <StatusBadge status="neutral">{vote.type.replace("_", " ")}</StatusBadge>
                        </div>
                        <p className="font-medium text-foreground">{vote.description}</p>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap bg-muted px-2.5 py-1 rounded-sm">
                        {formatDate(vote.date)}
                      </span>
                    </div>
                    
                    {/* Breakdown Bar */}
                    <div className="flex flex-col gap-2 mt-6">
                      <div className="flex w-full h-3 rounded-sm overflow-hidden bg-muted gap-0.5">
                        {vote.breakdown.yea > 0 && <AnimatedProgress className="bg-success h-full" value={(vote.breakdown.yea / Object.values(vote.breakdown).reduce((a,b)=>a+b,0)) * 100} delay={0.1} />}
                        {vote.breakdown.nay > 0 && <AnimatedProgress className="bg-destructive h-full" value={(vote.breakdown.nay / Object.values(vote.breakdown).reduce((a,b)=>a+b,0)) * 100} delay={0.2} />}
                        {vote.breakdown.abstain > 0 && <AnimatedProgress className="bg-warning h-full" value={(vote.breakdown.abstain / Object.values(vote.breakdown).reduce((a,b)=>a+b,0)) * 100} delay={0.3} />}
                        {vote.breakdown.absent > 0 && <AnimatedProgress className="bg-muted-foreground/30 h-full" value={(vote.breakdown.absent / Object.values(vote.breakdown).reduce((a,b)=>a+b,0)) * 100} delay={0.4} />}
                      </div>
                      <div className="flex flex-wrap justify-between text-xs font-medium text-muted-foreground mt-1">
                        <span className="text-success"><GlitchNumber value={vote.breakdown.yea} /> Yea</span>
                        <span className="text-destructive"><GlitchNumber value={vote.breakdown.nay} /> Nay</span>
                        <span className="text-warning"><GlitchNumber value={vote.breakdown.abstain} /> Abstain</span>
                        <span><GlitchNumber value={vote.breakdown.absent} /> Absent</span>
                      </div>
                    </div>

                    {/* Individual Member Votes */}
                    {vote.memberVotes.length > 0 && (
                      <details className="mt-4 group/details">
                        <summary className="text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary transition-colors select-none">
                          View {vote.memberVotes.length} individual votes
                        </summary>
                        <div className="mt-3 flex flex-col gap-0">
                          {vote.memberVotes.map((mv) => (
                            <div key={mv.memberSlug} className="flex items-center justify-between gap-2 py-2 border-b border-border/40 last:border-0">
                              <div className="flex items-center gap-2">
                                <Link href={`/members/${mv.memberSlug}`} className="text-sm font-medium hover:text-primary transition-colors">
                                  {mv.memberName}
                                </Link>
                                {mv.party && (
                                  <span
                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm text-white shrink-0"
                                    style={{ backgroundColor: mv.party.color ?? "#64748b" }}
                                  >
                                    {mv.party.abbreviation}
                                  </span>
                                )}
                              </div>
                              <StatusBadge status={mv.choice === "YEA" ? "success" : mv.choice === "NAY" ? "destructive" : "warning"}>
                                {mv.choice}
                              </StatusBadge>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {(!law.fullText && votes.length === 0) && (
            <div className="py-12 text-center border border-border border-dashed rounded-md bg-card/50">
              <Info className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">More details and voting records will be available once the bill progresses.</p>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Sidebar (Timeline & Meta) */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24">
          
          {/* Action Card */}
          {law.sourceUrl && (
            <div className="bg-primary text-primary-foreground rounded-md p-6 flex flex-col gap-4 shadow-sm">
              <h3 className="font-bold font-display text-lg">Official Source</h3>
              <p className="text-sm text-primary-foreground/80 leading-relaxed">
                Read the original raw documents and filings directly from the official parliamentary source.
              </p>
              <Button asChild variant="secondary" className="w-full mt-2 font-bold shadow-sm">
                <a href={law.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                  View Full Source <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
          )}

          {/* Meta Information Card */}
          <div className="bg-card border border-border rounded-md p-6 flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Sponsorship</h3>
              {law.proposedBy ? (
                <Link href={`/members/${law.proposedBy.slug}`} className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {law.proposedBy.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{law.proposedBy.name}</span>
                    <span className="text-xs text-muted-foreground">Primary Sponsor</span>
                  </div>
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground italic">No primary sponsor recorded</span>
              )}
            </div>

            {law.tags.length > 0 && (
              <div className="border-t border-border pt-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><Tag className="w-4 h-4"/> Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {law.tags.map(tag => (
                    <span key={tag.name} className="text-xs font-medium bg-muted text-muted-foreground px-2.5 py-1 rounded-sm">
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Timeline Milestones */}
          <div className="bg-card border border-border rounded-md p-6 flex flex-col gap-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <History className="w-4 h-4" /> Legislative Timeline
            </h3>
            <div className="flex flex-col gap-5">
              {timeline.map((step, i) => (
                <div key={step.label} className="relative pl-6">
                  {/* Timeline Line */}
                  {i < timeline.length - 1 && (
                    <div className="absolute left-[7px] top-[24px] bottom-[-20px] w-px bg-border" />
                  )}
                  {/* Timeline Dot */}
                  <div className={`absolute left-0 top-[6px] w-3.5 h-3.5 rounded-full border-2 border-card ${step.isCurrent ? "bg-primary ring-2 ring-primary/20" : "bg-muted-foreground"}`} />
                  
                  <div className="flex flex-col gap-1">
                    <span className={`font-semibold ${step.isCurrent ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {step.date ? formatDate(step.date) : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  )
}
