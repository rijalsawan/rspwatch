"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Users, AlertCircle, FileText, ExternalLink } from "lucide-react"
import { PageTransition } from "@/components/animations/PageTransition"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

interface VoteDetail {
  id: string
  date: string
  type: string
  outcome: string
  description: string
  sourceUrl: string | null
  law: { id: string; slug: string; title: string; code: string | null } | null
  breakdown: { yea: number; nay: number; abstain: number; absent: number }
}

interface MemberVote {
  memberId: string
  memberName: string
  memberSlug: string
  choice: string
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

export default function VoteDetailPage() {
  const { id } = useParams()
  const idStr = typeof id === "string" ? id : (id?.[0] ?? "")

  const [vote, setVote] = useState<VoteDetail | null>(null)
  const [memberVotes, setMemberVotes] = useState<MemberVote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!idStr) return
    async function load() {
      try {
        const res = await fetch(`/api/votes/${idStr}`)
        const json = await res.json()
        if (json.error) {
          setError(json.error)
          return
        }
        if (json.data) {
          setVote(json.data.vote)
          setMemberVotes(json.data.memberVotes ?? [])
        }
      } catch {
        setError("Failed to load vote details")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [idStr])

  if (loading) {
    return (
      <PageTransition className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-10 w-full animate-pulse">
        <div className="h-6 w-32 bg-muted rounded mb-4" />
        <div className="h-12 w-3/4 bg-muted rounded" />
        <div className="h-64 w-full bg-card rounded-md border border-border mt-8" />
      </PageTransition>
    )
  }

  if (error || !vote) {
    return (
      <PageTransition className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-10 w-full">
        <Link href="/votes" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Votes
        </Link>
        <div className="bg-destructive/5 border border-destructive/20 rounded-md p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Vote Not Found</h2>
          <p className="text-muted-foreground">{error ?? "This vote could not be found."}</p>
        </div>
      </PageTransition>
    )
  }

  // Chart and Defection Logic
  const totalVotes = vote.breakdown.yea + vote.breakdown.nay + vote.breakdown.abstain + vote.breakdown.absent
  const chartData = [
    { name: "YEA", value: vote.breakdown.yea, fill: "var(--success)" },
    { name: "NAY", value: vote.breakdown.nay, fill: "var(--destructive)" },
    { name: "ABSTAIN", value: vote.breakdown.abstain, fill: "var(--warning)" },
    { name: "ABSENT", value: vote.breakdown.absent, fill: "var(--muted-foreground)" }
  ].filter(d => d.value > 0)

  // Find the party majority line
  const majorityChoice = chartData.reduce((prev, current) => (prev.value > current.value) ? prev : current).name

  const yeas = memberVotes.filter(m => m.choice === "YEA")
  const nays = memberVotes.filter(m => m.choice === "NAY")
  const abstains = memberVotes.filter(m => m.choice === "ABSTAIN")
  const absents = memberVotes.filter(m => m.choice === "ABSENT")

  const MemberList = ({ list, isDefectorList = false }: { list: MemberVote[], isDefectorList?: boolean }) => {
    if (list.length === 0) return <p className="text-muted-foreground p-4">No members in this category.</p>
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-2">
        {list.map(m => {
          const isDefector = !isDefectorList && majorityChoice !== "ABSENT" && m.choice !== majorityChoice && m.choice !== "ABSENT"
          return (
            <Link key={m.memberId} href={`/members/${m.memberSlug}`} className="flex items-center gap-3 p-3 bg-card border border-border rounded-md hover:border-primary/50 transition-colors">
              <div className="flex-1 flex items-center justify-between">
                <span className="font-medium text-sm">{m.memberName}</span>
                {isDefector && <AlertCircle className="w-4 h-4 text-warning" aria-label="Rebel Vote" />}
              </div>
            </Link>
          )
        })}
      </div>
    )
  }

  const defectors = memberVotes.filter(m => majorityChoice !== "ABSENT" && m.choice !== majorityChoice && m.choice !== "ABSENT")

  return (
    <PageTransition className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-8 w-full">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <Link href="/votes" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors w-fit outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Votes
        </Link>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StatusBadge status={vote.outcome === "PASSED" ? "success" : "destructive"}>{vote.outcome}</StatusBadge>
            <StatusBadge status="neutral">{vote.type.replace("_", " ")}</StatusBadge>
            <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-0.5 rounded-full">{formatDate(vote.date)}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold leading-tight">{vote.description}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          <div className="bg-card border border-border rounded-md p-6">
            <h2 className="text-xl font-display font-bold flex items-center gap-2 border-b border-border pb-3 mb-6">
              <Users className="w-5 h-5 text-primary" /> Roll Call Details
            </h2>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full h-auto p-1 mb-6">
                <TabsTrigger value="all" className="py-2.5">All ({memberVotes.length})</TabsTrigger>
                <TabsTrigger value="yea" className="py-2.5 text-success data-[state=active]:text-success"><span className="w-2 h-2 rounded-full bg-success mr-2"/> Yea ({vote.breakdown.yea})</TabsTrigger>
                <TabsTrigger value="nay" className="py-2.5 text-destructive data-[state=active]:text-destructive"><span className="w-2 h-2 rounded-full bg-destructive mr-2"/> Nay ({vote.breakdown.nay})</TabsTrigger>
                <TabsTrigger value="abstain" className="py-2.5 text-warning data-[state=active]:text-warning"><span className="w-2 h-2 rounded-full bg-warning mr-2"/> Abstain ({vote.breakdown.abstain})</TabsTrigger>
                <TabsTrigger value="absent" className="py-2.5 text-muted-foreground data-[state=active]:text-muted-foreground"><span className="w-2 h-2 rounded-full bg-muted-foreground mr-2"/> Absent ({vote.breakdown.absent})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-0 min-h-[400px] animate-in fade-in duration-500">
                <MemberList list={memberVotes} />
              </TabsContent>
              <TabsContent value="yea" className="mt-0">
                <MemberList list={yeas} />
              </TabsContent>
              <TabsContent value="nay" className="mt-0">
                <MemberList list={nays} />
              </TabsContent>
              <TabsContent value="abstain" className="mt-0">
                <MemberList list={abstains} />
              </TabsContent>
              <TabsContent value="absent" className="mt-0">
                <MemberList list={absents} />
              </TabsContent>
            </Tabs>
          </div>
          
          {defectors.length > 0 && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-md p-6">
              <h2 className="text-xl font-display font-bold flex items-center gap-2 text-destructive border-b border-destructive/20 pb-3 mb-4">
                <AlertCircle className="w-5 h-5" /> Party Line Defections
              </h2>
              <p className="text-sm text-foreground/80 mb-4">
                The party majority voted <strong>{majorityChoice}</strong>. The following {defectors.length} member(s) voted against the party line:
              </p>
              <MemberList list={defectors} isDefectorList={true} />
            </div>
          )}

        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-card border border-border rounded-md p-6 flex flex-col gap-6 sticky top-[88px]">
            <h3 className="font-display font-bold text-xl border-b border-border pb-2">Vote Breakdown</h3>
            
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12 mt-12">
                <span className="text-3xl font-display font-bold">{totalVotes}</span>
                <span className="text-xs font-medium text-muted-foreground">RSP Votes</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between items-center bg-success/10 text-success p-2 px-3 rounded-md">
                <span className="font-semibold">Yea</span>
                <span>{vote.breakdown.yea} ({Math.round(vote.breakdown.yea / totalVotes * 100)}%)</span>
              </div>
              <div className="flex justify-between items-center bg-destructive/10 text-destructive p-2 px-3 rounded-md">
                <span className="font-semibold">Nay</span>
                <span>{vote.breakdown.nay} ({Math.round(vote.breakdown.nay / totalVotes * 100)}%)</span>
              </div>
              <div className="flex justify-between items-center bg-warning/10 text-warning p-2 px-3 rounded-md">
                <span className="font-semibold">Abstain</span>
                <span>{vote.breakdown.abstain} ({Math.round(vote.breakdown.abstain / totalVotes * 100)}%)</span>
              </div>
              <div className="flex justify-between items-center bg-muted/50 text-muted-foreground p-2 px-3 rounded-md border border-border/50">
                <span className="font-semibold">Absent</span>
                <span>{vote.breakdown.absent} ({Math.round(vote.breakdown.absent / totalVotes * 100)}%)</span>
              </div>
            </div>

            {vote.law && (
              <div className="mt-4 pt-4 border-t border-border flex flex-col gap-3">
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Related Legislation</h4>
                <Link href={`/laws/${vote.law.slug}`} className="flex items-start gap-3 group p-3 border border-border/50 rounded-md hover:bg-muted/30 transition-colors">
                  <FileText className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">{vote.law.title}</span>
                    {vote.law.code && <span className="text-xs text-muted-foreground mt-1 font-mono">{vote.law.code}</span>}
                  </div>
                </Link>
              </div>
            )}
            
            {vote.sourceUrl && (
              <Button variant="outline" className="w-full mt-2 gap-2" asChild>
                <a href={vote.sourceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" /> Official Record
                </a>
              </Button>
            )}
          </div>
        </div>

      </div>
    </PageTransition>
  )
}
