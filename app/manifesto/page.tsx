"use client"

import { useState } from "react"
import { useCachedFetch } from "@/hooks/use-cached-fetch"
import Link from "next/link"
import { PromiseCard, type PromiseStatus as CardStatus } from "@/components/domain/PromiseCard"
import { PageTransition } from "@/components/animations/PageTransition"
import { StaggerList } from "@/components/animations/StaggerList"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatedProgress } from "@/components/animations/AnimatedProgress"
import { GlitchNumber } from "@/components/animations/GlitchNumber"
import {
  Download,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  CircleDashed,
  ExternalLink,
  TrendingUp,
  Target,
  Users,
  Building,
  GraduationCap,
  Heart,
  Briefcase,
  Landmark,
} from "lucide-react"

// Status colors and icons
const STATUS_CONFIG = {
  KEPT: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "Kept" },
  IN_PROGRESS: { icon: Clock, color: "text-warning", bg: "bg-warning/10", label: "In Progress" },
  BROKEN: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Broken" },
  NOT_STARTED: { icon: CircleDashed, color: "text-muted-foreground", bg: "bg-muted/50", label: "Not Started" },
}

function toCardStatus(s: string): CardStatus {
  const map: Record<string, CardStatus> = {
    KEPT: "kept", IN_PROGRESS: "in-progress", BROKEN: "broken", NOT_STARTED: "not-started",
  }
  return map[s] ?? "not-started"
}

// Manifesto pillar definitions with icons
const PILLARS = [
  { key: "Governance", label: "Good Governance", icon: Building, description: "Transparent, accountable, corruption-free governance" },
  { key: "Anti-Corruption", label: "Anti-Corruption", icon: Target, description: "Zero tolerance for corruption at all levels" },
  { key: "Education", label: "Education Reform", icon: GraduationCap, description: "Quality, accessible education for all Nepalis" },
  { key: "Economy", label: "Economic Growth", icon: TrendingUp, description: "Sustainable growth and job creation" },
  { key: "Health", label: "Healthcare", icon: Heart, description: "Universal access to quality healthcare" },
  { key: "Employment", label: "Employment", icon: Briefcase, description: "Dignified employment opportunities" },
  { key: "Infrastructure", label: "Infrastructure", icon: Landmark, description: "Quality roads, energy, and digital connectivity" },
  { key: "Social", label: "Social Justice", icon: Users, description: "Equality and inclusion for all communities" },
]

interface DocumentData {
  id: string
  title: string
  fileName: string
  coverImage: string
  coverImageDirect: string
  downloadUrl: string
  downloadCount: number
  publishedAt: string
  updatedAt: string
}

interface PromiseData {
  id: string
  slug: string
  title: string
  description: string | null
  category: string
  status: string
  source: string | null
  evidenceUrl: string | null
  lastUpdated: string
}

interface ApiResponse {
  data: PromiseData[]
  meta?: {
    total: number
    byStatus: Record<string, number>
    byCategory: Record<string, Record<string, number>>
  }
}

export default function ManifestoPage() {
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null)

  // Use cached fetch for both APIs
  const { data: promisesResponse, loading: promisesLoading } = useCachedFetch<ApiResponse>("/api/promises")
  const { data: documentsResponse, loading: docsLoading } = useCachedFetch<{data: DocumentData[]}>("/api/manifesto/documents")

  // Extract and filter data
  const allPromises = promisesResponse?.data ?? []
  const promises = allPromises.filter(p => p.source === "MANIFESTO" || p.source === "CITIZEN_CONTRACT")
  const documents = documentsResponse?.data ?? []
  const statusSummary = promisesResponse?.meta?.byStatus ?? { KEPT: 0, IN_PROGRESS: 0, BROKEN: 0, NOT_STARTED: 0 }
  const categoryBreakdown = promisesResponse?.meta?.byCategory ?? {}
  const loading = promisesLoading

  const filteredPromises = selectedPillar
    ? promises.filter((p) => p.category === selectedPillar)
    : promises

  const total = statusSummary.KEPT + statusSummary.IN_PROGRESS + statusSummary.BROKEN + statusSummary.NOT_STARTED || 1
  const progressPercentage = Math.round(
    ((statusSummary.KEPT + statusSummary.IN_PROGRESS * 0.5) / total) * 100
  )

  return (
    <PageTransition className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-10 w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <span className="text-sm font-semibold tracking-wider uppercase text-primary">
              Official Party Documents & Pledges
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
            Manifesto Tracker
          </h1>
          <p className="text-lg text-muted-foreground">
            Track RSP's progress on their official manifesto commitments and election promises.
            Every pledge is monitored, verified, and scored for accountability.
          </p>
        </div>

        {/* Overall Progress Ring */}
        <div className="flex items-center gap-6 p-6 bg-card border border-border rounded-md min-w-[280px]">
          <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="currentColor"
                className="text-muted"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="currentColor"
                className="text-primary"
                strokeWidth="3"
                strokeDasharray={`${progressPercentage} 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold tabular-nums"><GlitchNumber value={progressPercentage} />%</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">Overall Progress</span>
            <span className="text-sm">
              <span className="font-semibold text-success">{statusSummary.KEPT}</span> kept,{" "}
              <span className="font-semibold text-warning">{statusSummary.IN_PROGRESS}</span> in progress
            </span>
          </div>
        </div>
      </div>

      {/* Tabs: Overview / Download Documents */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Progress Overview</TabsTrigger>
          <TabsTrigger value="documents">Download Documents</TabsTrigger>
          <TabsTrigger value="pillars">By Pillar</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8 min-h-[600px] animate-in fade-in duration-500">
          {/* Status Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
              const Icon = config.icon
              const count = statusSummary[key] || 0
              return (
                <div
                  key={key}
                  className="p-5 rounded-md border border-border flex flex-col gap-3 bg-card"
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-sm ${config.bg}`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <span className="font-semibold tracking-wide uppercase text-sm text-foreground">
                      {config.label}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-display font-bold tabular-nums"><GlitchNumber value={count} /></span>
                      <span className="text-sm font-medium text-muted-foreground">
                        (<GlitchNumber value={Math.round((count / total) * 100)} />%)
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Category Progress Bars */}
      <div className="bg-card border border-border p-6 lg:p-8 rounded-md flex flex-col gap-8">
        <h3 className="font-display font-bold text-xl">Category Fulfillment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          {Object.entries(categoryBreakdown).map(([category, counts]) => {
            const catTotal = Object.values(counts).reduce((a, b) => a + b, 0) || 1
            const kept = Math.round(((counts.KEPT || 0) / catTotal) * 100)
            const inProgress = Math.round(((counts.IN_PROGRESS || 0) / catTotal) * 100)
            const broken = Math.round(((counts.BROKEN || 0) / catTotal) * 100)
            const pending = Math.max(0, 100 - kept - inProgress - broken)
            
            return (
              <div key={category} className="flex flex-col gap-3 group">
                <div className="flex justify-between items-end">
                  <span className="font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">{category}</span>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-display font-bold text-success tabular-nums leading-none">
                        <GlitchNumber value={kept} />%
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-1">Kept</span>
                  </div>
                </div>
                
                {/* Segmented Bar */}
                <div className="flex w-full h-3.5 gap-1 rounded-sm overflow-hidden bg-background">
                  {kept > 0 && <AnimatedProgress className="bg-success h-full" value={kept} delay={0.1} />}
                  {inProgress > 0 && <AnimatedProgress className="bg-warning h-full" value={inProgress} delay={0.2} />}
                  {broken > 0 && <AnimatedProgress className="bg-destructive h-full" value={broken} delay={0.3} />}
                  {pending > 0 && <AnimatedProgress className="bg-muted h-full" value={pending} delay={0.4} />}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-medium tracking-wide text-muted-foreground mt-1">
                  <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-success"/> {kept}% Kept</span>
                  <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-warning"/> {inProgress}% Ongoing</span>
                  <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-destructive"/> {broken}% Broken</span>
                </div>
              </div>
              )
            })}
            </div>
          </div>

          {/* Quick link to full promises page */}
          <div className="flex justify-center">
            <Link href="/promises">
              <Button variant="outline" size="lg">
                View All Promises
                <ExternalLink className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6 min-h-[600px] animate-in fade-in duration-500">
          <div className="bg-card border border-border p-6 rounded-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg">Official Party Documents</h3>
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                Live from rspnepal.org
              </span>
            </div>
            <p className="text-muted-foreground mb-6">
              All {documents.length} official documents synced live from RSP's website.
              Download manifesto, pledge documents, party constitution, and policy papers.
            </p>

            {docsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="border border-border rounded-md p-4 animate-pulse">
                    <div className="h-40 bg-muted rounded mb-3" />
                    <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="border border-border rounded-md bg-background hover:border-primary/50 transition-colors flex flex-col overflow-hidden group"
                  >
                    {/* Cover Image */}
                    <div className="relative h-44 bg-muted overflow-hidden">
                      <img
                        src={doc.coverImage}
                        alt={doc.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded">
                        {doc.downloadCount.toLocaleString()} downloads
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col gap-3 flex-1">
                      <h4 className="font-semibold text-foreground line-clamp-2 leading-snug">
                        {doc.title}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        Published {new Date(doc.publishedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <div className="mt-auto pt-2">
                        <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="w-full">
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </StaggerList>
            )}
          </div>

          {/* External links */}
          <div className="flex flex-wrap gap-3 justify-center text-sm">
            <a
              href="https://rspnepal.org/downloads"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              All Downloads on RSP Website
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <span className="text-muted-foreground">&middot;</span>
            <a
              href="https://rspnepal.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Official RSP Website
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </TabsContent>

        {/* Pillars Tab */}
        <TabsContent value="pillars" className="space-y-6 min-h-[600px] animate-in fade-in duration-500">
          {/* Pillar selector */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedPillar === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPillar(null)}
            >
              All Pillars
            </Button>
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon
              return (
                <Button
                  key={pillar.key}
                  variant={selectedPillar === pillar.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPillar(pillar.key)}
                >
                  <Icon className="w-4 h-4 mr-1.5" />
                  {pillar.label}
                </Button>
              )
            })}
          </div>

          {/* Selected pillar description */}
          {selectedPillar && (
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-md">
              <div className="flex items-center gap-3">
                {(() => {
                  const pillar = PILLARS.find((p) => p.key === selectedPillar)
                  if (!pillar) return null
                  const Icon = pillar.icon
                  return (
                    <>
                      <Icon className="w-5 h-5 text-primary" />
                      <div>
                        <h4 className="font-semibold">{pillar.label}</h4>
                        <p className="text-sm text-muted-foreground">{pillar.description}</p>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          )}

          {/* Promises list */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-md p-5 animate-pulse">
                  <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-full mb-1" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : filteredPromises.length > 0 ? (
            <StaggerList className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPromises.map((promise) => (
                <PromiseCard
                  key={promise.id}
                  id={promise.id}
                  slug={promise.slug}
                  title={promise.title}
                  description={promise.description ?? ""}
                  category={promise.category}
                  status={toCardStatus(promise.status)}
                  source={promise.source ?? "MANIFESTO"}
                  evidenceUrl={promise.evidenceUrl ?? undefined}
                />
              ))}
            </StaggerList>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No manifesto promises found{selectedPillar ? ` for ${selectedPillar}` : ""}.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageTransition>
  )
}
