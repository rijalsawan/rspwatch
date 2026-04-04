"use client"

import { useState, useMemo } from "react"
import { useCachedFetch } from "@/hooks/use-cached-fetch"
import { PageTransition } from "@/components/animations/PageTransition"
import { StaggerList } from "@/components/animations/StaggerList"
import Link from "next/link"
import {
  Landmark,
  Scale,
  Vote,
  UserCheck,
  Calendar,
  ExternalLink,
  ChevronRight,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Shield,
} from "lucide-react"

type ActivityType = "all" | "law" | "vote" | "appointment"

interface CalendarItem {
  id: string
  type: "law" | "vote" | "appointment"
  title: string
  subtitle: string | null
  date: string
  status: string | null
  sourceUrl: string | null
  confidence: string
  slug: string | null
  relatedMember: { id: string; slug: string; name: string } | null
  meta: Record<string, unknown>
}

interface CalendarResponse {
  data: CalendarItem[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasMore: boolean
    counts: { laws: number; votes: number; appointments: number }
  }
}

const TYPE_TABS: { value: ActivityType; label: string; icon: typeof Scale }[] = [
  { value: "all", label: "All Activity", icon: Landmark },
  { value: "law", label: "Laws & Bills", icon: Scale },
  { value: "vote", label: "Votes", icon: Vote },
  { value: "appointment", label: "Appointments", icon: UserCheck },
]

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  PASSED: { color: "text-success", icon: CheckCircle2 },
  ENACTED: { color: "text-success", icon: CheckCircle2 },
  DEFEATED: { color: "text-destructive", icon: XCircle },
  REJECTED: { color: "text-destructive", icon: XCircle },
  DRAFT: { color: "text-muted-foreground", icon: FileText },
  PROPOSED: { color: "text-warning", icon: Clock },
  COMMITTEE: { color: "text-primary", icon: FileText },
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null
  const config = STATUS_CONFIG[status]
  const Icon = config?.icon ?? Clock
  const color = config?.color ?? "text-muted-foreground"
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      {status.replace(/_/g, " ")}
    </span>
  )
}

function ConfidenceDot({ confidence }: { confidence: string }) {
  const color =
    confidence === "VERIFIED"
      ? "bg-success"
      : confidence === "SCRAPED"
        ? "bg-primary"
        : "bg-muted-foreground"
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground" title={confidence}>
      <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
      {confidence.toLowerCase()}
    </span>
  )
}

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case "law":
      return <Scale className="w-4 h-4" />
    case "vote":
      return <Vote className="w-4 h-4" />
    case "appointment":
      return <UserCheck className="w-4 h-4" />
    default:
      return <FileText className="w-4 h-4" />
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function groupByMonth(items: CalendarItem[]): Record<string, CalendarItem[]> {
  return items.reduce<Record<string, CalendarItem[]>>((acc, item) => {
    const date = new Date(item.date)
    const key = date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})
}

export default function ParliamentPage() {
  const [activeType, setActiveType] = useState<ActivityType>("all")

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({ type: activeType, limit: "30" })
    return `/api/parliament-calendar?${params}`
  }, [activeType])

  const { data: response, loading } = useCachedFetch<CalendarResponse>(apiUrl)

  const items = response?.data ?? []
  const counts = response?.meta?.counts ?? { laws: 0, votes: 0, appointments: 0 }
  const grouped = groupByMonth(items)

  return (
    <PageTransition className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-8 w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 max-w-3xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <Landmark className="w-6 h-6 text-primary" />
          </div>
          <span className="text-sm font-semibold tracking-wider uppercase text-primary">
            Parliamentary Record
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
          Parliament Activity
        </h1>
        <p className="text-lg text-muted-foreground">
          Bills introduced, votes held, and government appointments — tracked from official sources.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-md bg-primary/10">
            <Scale className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{counts.laws}</p>
            <p className="text-sm text-muted-foreground">Laws & Bills</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-md bg-primary/10">
            <Vote className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{counts.votes}</p>
            <p className="text-sm text-muted-foreground">Votes Recorded</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-md bg-primary/10">
            <UserCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{counts.appointments}</p>
            <p className="text-sm text-muted-foreground">Appointments</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-card border border-border rounded-lg overflow-x-auto">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveType(tab.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeType === tab.value
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex flex-col gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-md bg-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="h-5 bg-muted rounded w-2/3 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="flex flex-col gap-8">
          {Object.entries(grouped).map(([monthYear, monthItems]) => (
            <div key={monthYear}>
              <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                {monthYear}
                <span className="text-xs text-muted-foreground font-normal">
                  ({monthItems.length} {monthItems.length === 1 ? "item" : "items"})
                </span>
              </h2>
              <StaggerList className="flex flex-col gap-3">
                {monthItems.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="bg-card border border-border rounded-lg p-5 hover:border-primary/30 transition-colors group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Type icon */}
                      <div
                        className={`p-2.5 rounded-md shrink-0 ${
                          item.type === "law"
                            ? "bg-blue-500/10 text-blue-500"
                            : item.type === "vote"
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-green-500/10 text-green-500"
                        }`}
                      >
                        <TypeIcon type={item.type} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div className="min-w-0">
                            {item.type === "law" && item.slug ? (
                              <Link
                                href={`/laws/${item.slug}`}
                                className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 block"
                              >
                                {item.title}
                              </Link>
                            ) : (
                              <h3 className="font-semibold text-foreground line-clamp-2">
                                {item.title}
                              </h3>
                            )}
                            {item.subtitle && (
                              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                          <StatusBadge status={item.status} />
                        </div>

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(item.date)}
                          </span>

                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
                            {item.type}
                          </span>

                          <ConfidenceDot confidence={item.confidence} />

                          {item.relatedMember && (
                            <Link
                              href={`/members/${item.relatedMember.slug}`}
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              {item.relatedMember.name}
                            </Link>
                          )}

                          {item.type === "vote" && item.meta.totalVoters ? (
                            <span className="flex items-center gap-1">
                              <Shield className="w-3.5 h-3.5" />
                              {String(item.meta.totalVoters)} voters
                            </span>
                          ) : null}

                          {item.sourceUrl && (
                            <a
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline ml-auto"
                            >
                              Source <ArrowUpRight className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </StaggerList>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-md">
          <Landmark className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">No parliamentary activity found</h3>
          <p className="text-muted-foreground mt-1">
            Activities will appear here as data is collected from official sources.
          </p>
        </div>
      )}

      {/* Footer note */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Shield className="w-3.5 h-3.5" />
        Data scraped from{" "}
        <a
          href="https://hr.parliament.gov.np"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          hr.parliament.gov.np
        </a>
        {" & "}
        <a
          href="https://na.parliament.gov.np"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          na.parliament.gov.np
        </a>
      </div>
    </PageTransition>
  )
}
