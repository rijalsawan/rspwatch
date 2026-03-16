"use client"

import { useEffect, useState } from "react"
import { PageTransition } from "@/components/animations/PageTransition"
import { StatusBadge } from "@/components/shared/StatusBadge"
import type { StatusType } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, MapPin, Briefcase, CheckCircle2, History, X } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ActivityFeedItem } from "@/components/shared/ActivityFeedItem"

interface MemberDetail {
  id: string
  slug: string
  name: string
  nameNepali: string | null
  photoUrl: string | null
  constituency: string
  province: string
  role: string
  isActive: boolean
  attendancePercent: number | null
}

interface ProposedLaw {
  slug: string
  title: string
  code: string
  status: string
  category: string
  summary: string | null
  proposedDate: string
}

interface VoteHistoryItem {
  voteId: string
  date: string
  description: string
  type: string
  outcome: string
  lawTitle: string | null
  lawSlug: string | null
  choice: string
}

interface StatementItem {
  id: string
  title: string
  content: string | null
  date: string
  sourceUrl: string | null
}

function choiceToStatus(choice: string): StatusType {
  if (choice === "YEA") return "success"
  if (choice === "NAY") return "destructive"
  return "warning"
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function MemberDetailPage() {
  const { slug } = useParams()
  const slugStr = typeof slug === "string" ? slug : (slug?.[0] ?? "")

  const [member, setMember] = useState<MemberDetail | null>(null)
  const [proposedLaws, setProposedLaws] = useState<ProposedLaw[]>([])
  const [voteHistory, setVoteHistory] = useState<VoteHistoryItem[]>([])
  const [statements, setStatements] = useState<StatementItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slugStr) return
    async function load() {
      try {
        const res = await fetch(`/api/members/${slugStr}`)
        const json = await res.json()
        if (json.error) {
          setError(json.error)
          return
        }
        if (json.data) {
          setMember(json.data.member)
          setProposedLaws(json.data.proposedLaws ?? [])
          setVoteHistory(json.data.voteHistory ?? [])
          setStatements(json.data.statements ?? [])
        }
      } catch {
        setError("Failed to load member data")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slugStr])

  const isLeadership = member && member.role !== "Member of Parliament"

  if (loading) {
    return (
      <PageTransition className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-10 w-full">
        <div className="animate-pulse">
          <div className="h-4 w-32 bg-muted rounded mb-8" />
          <div className="bg-card border border-border rounded-md p-6 md:p-10 flex flex-col md:flex-row gap-8">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-muted" />
            <div className="flex-1 space-y-4">
              <div className="h-10 bg-muted rounded w-2/3" />
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-1/4" />
            </div>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (error || !member) {
    return (
      <PageTransition className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-10 w-full">
        <Link href="/members" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </Link>
        <div className="bg-destructive/5 border border-destructive/20 rounded-md p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Member Not Found</h2>
          <p className="text-muted-foreground">{error ?? "This member could not be found."}</p>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-10 w-full">

      {/* Breadcrumbs */}
      <Link href="/members" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors w-fit outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm mb-[-16px]">
        <ArrowLeft className="w-4 h-4" /> Back to Directory
      </Link>

      {/* Profile Header Hero */}
      <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6 md:gap-8 bg-card border border-border rounded-md p-6 md:p-10">
        <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-secondary border-4 border-background shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
          {member.photoUrl ? (
            <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            <User className="w-16 h-16 md:w-20 md:h-20 text-muted-foreground" />
          )}
        </div>

        <div className="flex flex-col justify-center items-center md:items-start text-center md:text-left gap-3 flex-1">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h1 className="text-3xl md:text-5xl font-display font-bold">{member.name}</h1>
              <StatusBadge status={isLeadership ? "primary" : "neutral"} className="hidden md:inline-flex mt-1">
                {member.role}
              </StatusBadge>
            </div>
            {member.nameNepali && <span className="text-lg text-muted-foreground">{member.nameNepali}</span>}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-muted-foreground font-medium mt-2">
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {member.constituency}</span>
              <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {member.province}</span>
            </div>
            <StatusBadge status={isLeadership ? "primary" : "neutral"} className="md:hidden mt-2 self-center">
              {member.role}
            </StatusBadge>
          </div>

          <div className="flex gap-3 mt-4 w-full md:w-auto">
            {proposedLaws.length > 0 && (
              <Button className="w-full md:w-auto" onClick={() => document.getElementById("sponsored-bills")?.scrollIntoView({ behavior: "smooth" })}>
                View Sponsored Bills
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 flex flex-col gap-10">

          {voteHistory.length > 0 && (
            <section className="flex flex-col gap-6">
              <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                <History className="w-6 h-6 text-primary" /> Recent Activity
              </h2>
              <div className="bg-card border border-border rounded-md p-6 sm:p-8">
                {voteHistory.slice(0, 5).map((v, i) => (
                  <ActivityFeedItem
                    key={v.voteId}
                    date={formatDate(v.date)}
                    title={`Voted ${v.choice} on ${v.lawTitle ?? v.description}`}
                    description={`${v.type.replace("_", " ")} vote — Outcome: ${v.outcome}`}
                    category="Floor Vote"
                    status={choiceToStatus(v.choice)}
                    href={v.lawSlug ? `/laws/${v.lawSlug}` : "#"}
                    isLast={i === Math.min(voteHistory.length, 5) - 1}
                  />
                ))}
              </div>
            </section>
          )}

          {proposedLaws.length > 0 && (
            <section id="sponsored-bills" className="flex flex-col gap-6">
              <h2 className="text-2xl font-display font-bold">Sponsored Bills</h2>
              <div className="flex flex-col gap-3">
                {proposedLaws.map((law) => (
                  <Link key={law.slug} href={`/laws/${law.slug}`} className="bg-card border border-border rounded-md p-5 hover:border-primary/50 transition-colors group">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <StatusBadge status={law.status === "PASSED" || law.status === "ENACTED" ? "success" : law.status === "REJECTED" ? "destructive" : "warning"}>
                        {law.status}
                      </StatusBadge>
                      <StatusBadge status="neutral">{law.category}</StatusBadge>
                      <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">{law.code}</span>
                    </div>
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{law.title}</h3>
                    {law.summary && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{law.summary}</p>}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {statements.length > 0 && (
            <section className="flex flex-col gap-6">
              <h2 className="text-2xl font-display font-bold">Statements</h2>
              <div className="flex flex-col gap-3">
                {statements.map((s) => (
                  <div key={s.id} className="bg-card border border-border rounded-md p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold">{s.title}</h3>
                      <span className="text-xs text-muted-foreground shrink-0 ml-4">{formatDate(s.date)}</span>
                    </div>
                    {s.content && <p className="text-sm text-muted-foreground line-clamp-3">{s.content}</p>}
                    {s.sourceUrl && (
                      <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-2 inline-block">Source</a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN: Stats Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-card border border-border rounded-md p-6 flex flex-col gap-6 sticky top-[88px]">

            <div className="flex flex-col gap-2">
              <h3 className="font-display font-bold text-lg border-b border-border pb-2">Record Stats</h3>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Parliament Attendance</span>
                <span className="font-bold text-success">{member.attendancePercent ?? "N/A"}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Total Votes Cast</span>
                <span className="font-bold">{voteHistory.length}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Bills Sponsored</span>
                <span className="font-bold">{proposedLaws.length}</span>
              </div>
            </div>

            {voteHistory.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="font-display font-bold text-lg border-b border-border pb-2">Latest Key Votes</h3>
                <div className="space-y-3">
                  {voteHistory.slice(0, 4).map((v) => (
                    <div key={v.voteId} className="flex items-start gap-3">
                      <div className={`p-1 rounded-sm shrink-0 ${v.choice === "YEA" ? "bg-success/10 text-success" : v.choice === "NAY" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                        {v.choice === "YEA" ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold leading-tight">{v.lawTitle ?? v.description}</span>
                        <span className="text-xs text-muted-foreground">Voted {v.choice} ({formatDate(v.date)})</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/votes" className="text-sm font-medium text-primary hover:underline mt-2 inline-block">
                  See all voting records
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </PageTransition>
  )
}
