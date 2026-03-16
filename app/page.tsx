"use client"

import { useCachedFetch } from "@/hooks/use-cached-fetch"
import { PageTransition } from "@/components/animations/PageTransition"
import { StatCard } from "@/components/shared/StatCard"
import { ActivityFeedItem } from "@/components/shared/ActivityFeedItem"
import { StatusBadge } from "@/components/shared/StatusBadge"
import type { StatusType } from "@/components/shared/StatusBadge"
import { StaggerList } from "@/components/animations/StaggerList"
import { ArrowRight, BookOpen, CheckCircle2, Users, FileText, Calendar } from "lucide-react"
import Link from "next/link"

interface StatsData {
  lawsPassed: number
  promisesTracked: number
  promisesKept: number
  daysInPower: number
  activeMps: number
  totalVotes: number
  promisesByStatus: Record<string, number>
}

interface FeedItem {
  id: string
  type: string
  title: string
  summary: string | null
  date: string
  entitySlug: string | null
}

interface LawItem {
  slug: string
  title: string
  status: string
  category: string
  summary: string | null
  proposedBy: { name: string } | null
}

interface PressItem {
  id: string
  slug: string
  title: string
  titleNp: string
  excerpt: string
  coverImage: string | null
  tags: string[]
  sourceUrl: string
  date: string
}

function activityTypeToCategory(type: string): string {
  const map: Record<string, string> = {
    LAW: "Law",
    VOTE: "Floor Vote",
    STATEMENT: "Statement",
    PROMISE_UPDATE: "Promise Update",
    APPOINTMENT: "Appointment",
    CONTROVERSY: "Controversy",
  }
  return map[type] ?? type
}

function activityTypeToStatus(type: string): StatusType {
  const map: Record<string, StatusType> = {
    LAW: "passed",
    VOTE: "neutral",
    STATEMENT: "primary",
    PROMISE_UPDATE: "kept",
    APPOINTMENT: "neutral",
    CONTROVERSY: "warning",
  }
  return map[type] ?? "neutral"
}

function activityTypeToHref(type: string, entitySlug: string | null): string {
  if (!entitySlug) return "#"
  const map: Record<string, string> = {
    LAW: `/laws/${entitySlug}`,
    VOTE: `/votes/${entitySlug}`,
    PROMISE_UPDATE: `/promises`,
    STATEMENT: `/timeline`,
  }
  return map[type] ?? "#"
}

function lawStatusToDisplay(status: string): StatusType {
  const map: Record<string, StatusType> = {
    PASSED: "passed",
    ENACTED: "passed",
    PROPOSED: "pending",
    COMMITTEE: "pending",
    DRAFT: "pending",
    REJECTED: "rejected",
  }
  return map[status] ?? "neutral"
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default function Home() {
  // Use cached fetch for all API calls
  const { data: stats, loading: statsLoading } = useCachedFetch<{data: StatsData}>("/api/stats")
  const { data: feedResponse, loading: feedLoading } = useCachedFetch<{data: FeedItem[]}>("/api/feed?limit=3")
  const { data: lawsResponse, loading: lawsLoading } = useCachedFetch<{data: LawItem[]}>("/api/laws?limit=1")
  const { data: pressResponse, loading: pressLoading } = useCachedFetch<{data: PressItem[]}>("/api/news?limit=2")

  // Extract data from cached responses
  const statsData = stats?.data ?? null
  const feed = feedResponse?.data ?? []
  const featuredLaw = lawsResponse?.data?.[0] ?? null
  const pressItems = pressResponse?.data ?? []

  // Overall loading state - true if any individual fetch is still loading
  const loading = statsLoading || feedLoading || lawsLoading || pressLoading

  const promisesByStatus = statsData?.promisesByStatus ?? { KEPT: 0, IN_PROGRESS: 0, BROKEN: 0, NOT_STARTED: 0 }
  const totalPromises = statsData?.promisesTracked || 1
  const keptPct = Math.round((promisesByStatus.KEPT / totalPromises) * 100)
  const inProgressPct = Math.round((promisesByStatus.IN_PROGRESS / totalPromises) * 100)
  const brokenPct = Math.round((promisesByStatus.BROKEN / totalPromises) * 100)

  return (
    <PageTransition className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16 flex flex-col gap-12">
      {/* Hero Section */}
      <section className="flex flex-col gap-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <StatusBadge status="primary" pulse>Live Tracker Active</StatusBadge>
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {statsData ? `Day ${statsData.daysInPower} in Power` : "Loading..."}
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight tracking-tight text-foreground">
          Holding Power Accountable Through Data.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
          Public, un-editorialized tracking of the Rastriya Swatantra Party's
          governance, promises, legislative actions, and parliamentary votes.
        </p>
      </section>

      {/* Live Stats Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border p-6 rounded-md flex flex-col gap-2">
              <div className="h-5 bg-muted rounded w-2/3 animate-pulse" />
              <div className="h-10 bg-muted rounded w-1/3 animate-pulse mt-1" />
            </div>
          ))
        ) : (
          <>
            <StatCard label="Total Laws Passed" value={statsData?.lawsPassed ?? 0} />
            <StatCard label="Promises Tracked" value={statsData?.promisesTracked ?? 0} />
            <StatCard label="Promises Kept" value={statsData?.promisesKept ?? 0} trend={totalPromises > 1 ? { value: `${keptPct}% completion`, positive: true } : undefined} />
            <StatCard label="Active MPs" value={statsData?.activeMps ?? 0} />
          </>
        )}
      </section>

      {/* Main Grid Floor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

        {/* Left Col: Main Content (Feed + Featured) */}
        <div className="lg:col-span-8 flex flex-col gap-10">

          {/* Featured Law */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold">Featured Law</h2>
              <Link href="/laws" className="text-sm font-medium text-primary hover:underline underline-offset-4 flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="bg-card border border-border rounded-md p-6 lg:p-8 animate-pulse flex flex-col">
                <div className="flex gap-2 mb-4"><div className="h-6 w-16 bg-muted rounded-full" /><div className="h-6 w-24 bg-muted rounded-full" /></div>
                <div className="h-8 bg-muted rounded w-3/4 mb-3" />
                <div className="space-y-2 mb-6">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-9 bg-muted rounded w-28" />
                </div>
              </div>
            ) : featuredLaw ? (
              <div className="bg-card border border-border rounded-md p-6 lg:p-8 hover:border-primary/50 transition-colors group">
                <div className="flex flex-wrap gap-2 mb-4">
                  <StatusBadge status={lawStatusToDisplay(featuredLaw.status)}>{featuredLaw.status}</StatusBadge>
                  <StatusBadge status="neutral">{featuredLaw.category}</StatusBadge>
                </div>
                <h3 className="text-2xl font-semibold mb-3 group-hover:text-primary transition-colors">
                  {featuredLaw.title}
                </h3>
                <p className="text-muted-foreground mb-6 line-clamp-3">
                  {featuredLaw.summary}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                  <div className="text-sm text-muted-foreground space-x-4">
                    {featuredLaw.proposedBy && <span>Sponsor: {featuredLaw.proposedBy.name}</span>}
                  </div>
                  <Link href={`/laws/${featuredLaw.slug}`} className="text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-sm hover:-translate-y-0.5 transition-transform">
                    Read Details
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-md p-6 text-center text-muted-foreground">
                No laws found yet.
              </div>
            )}
          </section>

          {/* Timeline Feed */}
          <section className="flex flex-col gap-6">
            <h2 className="text-2xl font-display font-bold">Latest Activity</h2>
            <div className="pt-2">
              {loading ? (
                <div className="space-y-0">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="relative pl-6 pb-8 animate-pulse">
                      {i !== 2 && <div className="absolute left-1.5 top-2 bottom-0 w-px bg-border translate-x-[-0.5px]" />}
                      <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-muted ring-4 ring-background" />
                      
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-20 bg-muted rounded" />
                          <div className="h-5 w-16 bg-muted rounded-full" />
                        </div>
                        <div className="h-5 w-3/4 bg-muted rounded mt-1" />
                        <div className="space-y-1">
                          <div className="h-4 w-full bg-muted rounded" />
                          <div className="h-4 w-5/6 bg-muted rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : feed.length > 0 ? (
                <StaggerList>
                  {feed.map((item, index) => (
                    <ActivityFeedItem
                      key={item.id}
                      date={formatDate(item.date)}
                      title={item.title}
                      description={item.summary ?? ""}
                      category={activityTypeToCategory(item.type)}
                      status={activityTypeToStatus(item.type)}
                      href={activityTypeToHref(item.type, item.entitySlug)}
                      isLast={index === feed.length - 1}
                    />
                  ))}
                </StaggerList>
              ) : (
                <div className="text-muted-foreground text-sm">No recent activity.</div>
              )}
            </div>
            <Link href="/timeline" className="text-sm font-medium text-primary hover:underline underline-offset-4 flex items-center gap-1 mt-2">
              View full timeline <ArrowRight className="w-4 h-4" />
            </Link>
          </section>

          {/* Press / News Carousel */}
          <section className="flex flex-col gap-4 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold">Press & News</h2>
              <Link href="/press" className="text-sm font-medium text-primary hover:underline underline-offset-4 flex items-center gap-1">
                View all releases <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {loading ? (
                <>
                  <div className="rounded-md border border-border bg-card p-5 animate-pulse">
                    <div className="h-5 w-24 bg-muted rounded mb-3" />
                    <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-full mb-1" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                  <div className="rounded-md border border-border bg-card p-5 animate-pulse hidden sm:block">
                    <div className="h-5 w-24 bg-muted rounded mb-3" />
                    <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-full mb-1" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                </>
              ) : pressItems.length > 0 ? (
                pressItems.map((item, idx) => (
                  <a
                    key={item.id}
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group rounded-md border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all flex flex-col overflow-hidden ${idx > 0 ? "hidden sm:flex" : ""}`}
                  >
                    {/* Cover image */}
                    {item.coverImage && (
                      <div className="h-36 overflow-hidden bg-muted shrink-0">
                        <img
                          src={item.coverImage}
                          alt={item.titleNp || item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-5 flex flex-col flex-1">
                      {item.tags.length > 0 && (
                        <span className="text-xs font-medium uppercase tracking-wider text-primary mb-2">
                          {item.tags[0]}
                        </span>
                      )}
                      <h3 className="font-bold text-base mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {item.titleNp || item.title}
                      </h3>
                      {item.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                          {item.excerpt}
                        </p>
                      )}
                      <span className="text-xs text-muted-foreground mt-auto">
                        {new Date(item.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </a>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  No press releases available yet.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Col: Summaries & Quick Access */}
        <div className="lg:col-span-4 flex flex-col gap-8">

          {/* This Week in Parliament */}
          <div className="bg-card border border-border p-6 rounded-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="font-display font-bold text-lg">This Week</h3>
              </div>
            </div>
            {loading ? (
              <ul className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-muted mt-1.5 shrink-0" />
                    <div className="flex-1 space-y-2 animate-pulse">
                      <div className="h-4 bg-muted rounded w-full" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : feed.length > 0 ? (
              <ul className="space-y-4">
                {feed.slice(0, 3).map((item) => (
                  <li key={item.id} className="flex items-start gap-3 text-sm">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${activityTypeToStatus(item.type) === "warning" ? "bg-warning" : "bg-primary"}`} />
                    <span className="text-muted-foreground">
                      <span className="text-foreground font-medium">{activityTypeToCategory(item.type)}</span>
                      {" — "}
                      {item.title}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            )}
          </div>

          {/* Promise Tracker Widget */}
          <div className="bg-card border border-border p-6 rounded-md flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg">Citizen Contract</h3>
              <Link href="/promises" className="text-primary hover:bg-primary/10 p-1.5 rounded-sm transition-colors">
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Visual Bar */}
            <div className="flex flex-col gap-2">
              <div className="flex w-full h-3 rounded-full overflow-hidden bg-muted">
                <div className="bg-success h-full" style={{ width: `${keptPct}%` }} />
                <div className="bg-warning h-full" style={{ width: `${inProgressPct}%` }} />
                <div className="bg-destructive h-full" style={{ width: `${brokenPct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground font-medium px-1">
                <span>{keptPct}% Kept</span>
                <span>{inProgressPct}% In Progress</span>
                <span>{brokenPct}% Broken</span>
              </div>
            </div>

            <ul className="space-y-3 mt-2 text-sm">
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  Kept
                </span>
                <span className="font-semibold tabular-nums">{promisesByStatus.KEPT}</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-warning border-t-transparent animate-spin" />
                  In Progress
                </span>
                <span className="font-semibold tabular-nums">{promisesByStatus.IN_PROGRESS}</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-destructive/20 border border-destructive flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-destructive rounded-full" />
                  </div>
                  Broken
                </span>
                <span className="font-semibold tabular-nums">{promisesByStatus.BROKEN}</span>
              </li>
            </ul>
          </div>

          {/* Quick Access Menu */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Laws & Bills", icon: BookOpen, href: "/laws", count: `${statsData?.lawsPassed ?? 0} Passed` },
              { label: "Party MPs", icon: Users, href: "/members", count: `${statsData?.activeMps ?? 0} Members` },
              { label: "Floor Votes", icon: CheckCircle2, href: "/votes", count: `${statsData?.totalVotes ?? 0} Sessions` },
              { label: "Statements", icon: FileText, href: "/timeline", count: "Full Timeline" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col gap-2 p-4 rounded-md border border-border bg-card hover:border-primary/50 hover:bg-secondary/50 transition-colors group outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <div>
                  <div className="font-semibold text-sm group-hover:text-primary transition-colors">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.count}</div>
                </div>
              </Link>
            ))}
          </div>

        </div>

      </div>
    </PageTransition>
  )
}
