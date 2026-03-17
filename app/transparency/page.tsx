"use client"

import { useCachedFetch } from "@/hooks/use-cached-fetch"
import { PageTransition } from "@/components/animations/PageTransition"
import { StaggerList } from "@/components/animations/StaggerList"
import { AnimatedProgress } from "@/components/animations/AnimatedProgress"
import { GlitchNumber } from "@/components/animations/GlitchNumber"
import { StatCard } from "@/components/shared/StatCard"
import {
  Shield,
  Database,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Server,
  FileText,
  Users,
  Scale,
  HandHeart,
  ChevronRight,
  Zap,
  HardDrive,
  AlertCircle,
  Minus,
  CalendarDays,
  Download,
  Image,
  Play,
  MapPin,
} from "lucide-react"

interface ScrapeLog {
  id: string
  jobName: string
  status: string
  recordsFound: number
  recordsCreated: number
  recordsUpdated: number
  durationMs: number | null
  ranAt: string
}

interface Stats {
  activeMps: number
  lawsPassed: number
  promisesTracked: number
  promisesKept: number
  totalVotes: number
  promisesByStatus: Record<string, number>
}

// RSP Official API endpoint coverage map
const RSP_API_ENDPOINTS = [
  {
    endpoint: "/executive-members",
    icon: Users,
    label: "Executive Members",
    total: 93,
    status: "db-sync" as const,
    statusLabel: "DB Sync",
    detail: "Scraped & synced to database — powers /members",
    page: "/members",
  },
  {
    endpoint: "/blog-contents",
    icon: FileText,
    label: "Blog & News",
    total: 56,
    status: "live" as const,
    statusLabel: "Live Proxy",
    detail: "Live proxy at /api/news — no database needed",
    page: "/press",
  },
  {
    endpoint: "/downloads",
    icon: Download,
    label: "Documents & Downloads",
    total: 15,
    status: "live" as const,
    statusLabel: "Live Proxy",
    detail: "Live proxy at /api/manifesto/documents",
    page: "/manifesto",
  },
  {
    endpoint: "/events",
    icon: CalendarDays,
    label: "Party Events",
    total: 61,
    status: "live" as const,
    statusLabel: "Live Proxy",
    detail: "Live proxy at /api/events — migrated from scraper",
    page: "/events",
  },
  {
    endpoint: "/galleries",
    icon: Image,
    label: "Photo Galleries",
    total: 47,
    status: "pending" as const,
    statusLabel: "Available",
    detail: "API available, no page surfaced yet",
    page: null,
  },
  {
    endpoint: "/videos",
    icon: Play,
    label: "Videos",
    total: 26,
    status: "pending" as const,
    statusLabel: "Available",
    detail: "API available, no page surfaced yet",
    page: null,
  },
  {
    endpoint: "/districts",
    icon: MapPin,
    label: "Districts (Nepal)",
    total: 77,
    status: "skipped" as const,
    statusLabel: "Not Needed",
    detail: "Geographic reference data, not relevant to tracker",
    page: null,
  },
]

const STATUS_STYLES = {
  live:     { dot: "bg-success", badge: "bg-success/15 text-success border-success/20",    icon: Zap },
  "db-sync":{ dot: "bg-primary", badge: "bg-primary/15 text-primary border-primary/20",    icon: HardDrive },
  pending:  { dot: "bg-warning", badge: "bg-warning/15 text-warning border-warning/20",    icon: AlertCircle },
  skipped:  { dot: "bg-muted-foreground/40", badge: "bg-muted text-muted-foreground border-border", icon: Minus },
}

// Traditional scrapers (no RSP API equivalent)
const SCRAPERS = [
  {
    name: "RSP Official Website",
    url: "https://rspnepal.org",
    icon: FileText,
    description: "Executive members synced to database — events, news, documents now use live API",
    jobName: "rsp-official",
    frequency: "Every 4 hours",
  },
  {
    name: "Parliament of Nepal",
    url: "https://parliament.gov.np",
    icon: Scale,
    description: "Bills, voting records, and MP attendance — no official API available",
    jobName: "parliament-bills",
    frequency: "Daily",
  },
  {
    name: "Kathmandu Post",
    url: "https://kathmandupost.com",
    icon: FileText,
    description: "Political news and RSP coverage",
    jobName: "kathmandu-post",
    frequency: "Every 6 hours",
  },
  {
    name: "OnlineKhabar",
    url: "https://english.onlinekhabar.com",
    icon: FileText,
    description: "Nepali political news and analysis",
    jobName: "onlinekhabar",
    frequency: "Every 6 hours",
  },
]

export default function TransparencyPage() {
  // Use cached fetch for both endpoints
  const { data: logsResponse, loading: logsLoading } = useCachedFetch<{data: ScrapeLog[]}>("/api/scrape-logs?limit=10")
  const { data: statsResponse, loading: statsLoading } = useCachedFetch<{data: Stats}>("/api/stats")

  const logs = logsResponse?.data ?? []
  const stats = statsResponse?.data ?? null
  const loading = logsLoading || statsLoading

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS": return <CheckCircle2 className="w-4 h-4 text-success" />
      case "FAILED":  return <XCircle className="w-4 h-4 text-destructive" />
      default:        return <Clock className="w-4 h-4 text-warning" />
    }
  }

  const getJobLabel = (jobName: string) => ({
    "rsp-official":      "RSP Official",
    "parliament-bills":  "Parliament Bills",
    "parliament-votes":  "Parliament Votes",
    "parliament-members":"Parliament Members",
    "kathmandu-post":    "Kathmandu Post",
    "onlinekhabar":      "OnlineKhabar",
  }[jobName] ?? jobName)

  const liveCount  = RSP_API_ENDPOINTS.filter((e) => e.status === "live").length
  const totalLive  = RSP_API_ENDPOINTS.reduce((s, e) => s + (e.status !== "skipped" && e.status !== "pending" ? e.total : 0), 0)

  return (
    <PageTransition className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-10 w-full">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4 max-w-3xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <span className="text-sm font-semibold tracking-wider uppercase text-primary">
            Open Data Initiative
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
          Transparency & Data Sources
        </h1>
        <p className="text-lg text-muted-foreground">
          Parliament Watch is committed to radical transparency. This page shows exactly where our data
          comes from, how it's integrated, and the full audit trail of our data collection.
        </p>
      </div>

      {/* ── Top Stats ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Data Points" value={stats ? (stats.activeMps + stats.lawsPassed + stats.promisesTracked).toString() : "—"} />
        <StatCard label="MPs Tracked"         value={stats?.activeMps?.toString() ?? "—"} />
        <StatCard label="Promises Monitored"  value={stats?.promisesTracked?.toString() ?? "—"} />
        <StatCard label="Laws Tracked"        value={stats?.lawsPassed?.toString() ?? "—"} />
      </div>

      {/* ── Accountability Overview ────────────────────── */}
      <section className="bg-card border border-border rounded-md p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold">Accountability Overview</h2>
            <p className="text-sm text-muted-foreground">Real-time tracking metrics</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex flex-col gap-1 p-4 bg-muted/30 rounded-lg">
            <span className="text-sm font-medium text-muted-foreground">Live API Endpoints</span>
            <span className="text-3xl font-bold font-display tracking-tight text-foreground">{liveCount}</span>
            <span className="text-xs text-primary font-medium mt-1">No scraping needed</span>
          </div>
          <div className="flex flex-col gap-1 p-4 bg-muted/30 rounded-lg">
            <span className="text-sm font-medium text-muted-foreground">Floor Votes Tracked</span>
            <span className="text-3xl font-bold font-display tracking-tight text-foreground">{stats?.totalVotes ?? 0}</span>
            <span className="text-xs text-muted-foreground mt-1">From parliament.gov.np</span>
          </div>
          <div className="flex flex-col gap-1 p-4 bg-muted/30 rounded-lg">
            <span className="text-sm font-medium text-muted-foreground">Promise Rate</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold font-display tracking-tight text-foreground">
                {stats && stats.promisesTracked > 0
                  ? Math.round((stats.promisesKept / stats.promisesTracked) * 100)
                  : 0}%
              </span>
              <span className="text-sm font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">Kept</span>
            </div>
            <span className="text-xs text-muted-foreground mt-1">
              {stats?.promisesKept ?? 0} of {stats?.promisesTracked ?? 0} promises
            </span>
          </div>
          <div className="flex flex-col gap-1 p-4 bg-muted/30 rounded-lg">
            <span className="text-sm font-medium text-muted-foreground">Active MPs</span>
            <span className="text-3xl font-bold font-display tracking-tight text-foreground">{stats?.activeMps ?? 0}</span>
            <span className="text-xs text-muted-foreground mt-1">RSP representatives</span>
          </div>
        </div>
      </section>

      {/* ── At a Glance Scorecard ──────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border p-6 rounded-md flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            <h3 className="font-display font-bold text-lg">Legislative Scorecard</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-2xl font-bold font-display text-primary tabular-nums">{stats?.lawsPassed ?? "—"}</span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Laws Passed</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold font-display text-foreground tabular-nums">{stats?.totalVotes ?? "—"}</span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Votes Cast</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold font-display text-success tabular-nums">
                {stats && stats.promisesTracked > 0
                  ? Math.round((stats.promisesKept / stats.promisesTracked) * 100)
                  : 0}%
              </span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Promises Kept</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold font-display text-warning tabular-nums">{stats?.promisesByStatus?.IN_PROGRESS ?? 0}</span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">In Progress</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-md flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-display font-bold text-lg">Promise Breakdown</h3>
          </div>
          {stats && stats.promisesTracked > 0 ? (
            <>
              <div className="flex w-full h-3 rounded-full overflow-hidden bg-muted">
                  <AnimatedProgress className="bg-success h-full" value={Math.round((stats.promisesKept / stats.promisesTracked) * 100)} delay={0.1} />
                  <AnimatedProgress className="bg-warning h-full" value={Math.round(((stats.promisesByStatus?.IN_PROGRESS ?? 0) / stats.promisesTracked) * 100)} delay={0.2} />
                  <AnimatedProgress className="bg-destructive h-full" value={Math.round(((stats.promisesByStatus?.BROKEN ?? 0) / stats.promisesTracked) * 100)} delay={0.3} />
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between items-center">
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" />Kept</span>
                  <span className="font-semibold tabular-nums">{stats.promisesKept}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-warning" />In Progress</span>
                  <span className="font-semibold tabular-nums">{stats.promisesByStatus?.IN_PROGRESS ?? 0}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="flex items-center gap-2"><XCircle className="w-4 h-4 text-destructive" />Broken</span>
                  <span className="font-semibold tabular-nums">{stats.promisesByStatus?.BROKEN ?? 0}</span>
                </li>
              </ul>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No promise data available yet.</p>
          )}
        </div>
      </section>

      {/* ── RSP Official API Coverage ──────────────────── */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-display font-bold">RSP Official API Coverage</h2>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              RSP runs a public API at{" "}
              <a href="https://api.rspnepal.org" target="_blank" rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-0.5">
                api.rspnepal.org <ExternalLink className="w-3 h-3" />
              </a>
              {" "}with {RSP_API_ENDPOINTS.length} endpoints discovered.
              Live Proxy endpoints return real-time data with no database caching.
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs font-medium shrink-0">
            {(["live", "db-sync", "pending", "skipped"] as const).map((s) => {
              const style = STATUS_STYLES[s]
              const labels = { live: "Live Proxy", "db-sync": "DB Sync", pending: "Available", skipped: "Not Needed" }
              return (
                <span key={s} className={`flex items-center gap-1.5 px-2 py-1 rounded border ${style.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  {labels[s]}
                </span>
              )
            })}
          </div>
        </div>

        {/* Endpoint table */}
        <div className="bg-card border border-border rounded-md overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-muted/40 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-3">Endpoint</div>
            <div className="col-span-2">Data Type</div>
            <div className="col-span-1 text-right">Items</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-4">Integration</div>
          </div>

          {RSP_API_ENDPOINTS.map((ep, i) => {
            const style = STATUS_STYLES[ep.status]
            const Icon = ep.icon
            const StatusIcon = style.icon
            return (
              <div
                key={ep.endpoint}
                className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${
                  ep.status === "skipped" ? "opacity-50" : ""
                }`}
              >
                {/* Endpoint */}
                <div className="md:col-span-3 flex items-center gap-2 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                  <code className="text-sm font-mono text-foreground truncate">
                    {ep.endpoint}
                  </code>
                </div>

                {/* Label */}
                <div className="md:col-span-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{ep.label}</span>
                </div>

                {/* Count */}
                <div className="md:col-span-1 flex items-center md:justify-end">
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {ep.total.toLocaleString()}
                    {ep.status === "pending" || ep.status === "live" ? "+" : ""}
                  </span>
                </div>

                {/* Status badge */}
                <div className="md:col-span-2 flex items-center">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded border ${style.badge}`}>
                    <StatusIcon className="w-3 h-3" />
                    {ep.statusLabel}
                  </span>
                </div>

                {/* Detail + page link */}
                <div className="md:col-span-4 flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground line-clamp-1">{ep.detail}</span>
                  {ep.page && (
                    <a
                      href={ep.page}
                      className="shrink-0 text-xs text-primary hover:underline flex items-center gap-0.5"
                    >
                      View <ChevronRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )
          })}

          {/* Footer summary */}
          <div className="px-5 py-3 bg-muted/20 border-t border-border flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
            <span>
              <span className="font-semibold text-success">{RSP_API_ENDPOINTS.filter(e => e.status === "live").length}</span> live proxies
            </span>
            <span>
              <span className="font-semibold text-primary">{RSP_API_ENDPOINTS.filter(e => e.status === "db-sync").length}</span> DB-synced
            </span>
            <span>
              <span className="font-semibold text-warning">{RSP_API_ENDPOINTS.filter(e => e.status === "pending").length}</span> available, not surfaced
            </span>
            <span className="ml-auto">
              Source:{" "}
              <a href="https://api.rspnepal.org" target="_blank" rel="noopener noreferrer"
                className="text-primary hover:underline">
                api.rspnepal.org
              </a>
            </span>
          </div>
        </div>
      </section>

      {/* ── Web Scrapers ───────────────────────────────── */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-display font-bold">Web Scrapers</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          For data sources without a public API — parliament records, news coverage — we run
          automated scrapers that log every run with a full audit trail.
        </p>

        <StaggerList className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SCRAPERS.map((source) => {
            const Icon = source.icon
            const recentLog = logs.find((l) => l.jobName === source.jobName)
            return (
              <div
                key={source.name}
                className="bg-card border border-border rounded-lg p-5 flex flex-col gap-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{source.name}</h3>
                      <p className="text-xs text-muted-foreground">{source.frequency}</p>
                    </div>
                  </div>
                  <a href={source.url} target="_blank" rel="noopener noreferrer"
                    className="text-primary hover:underline">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <p className="text-sm text-muted-foreground">{source.description}</p>
                {recentLog ? (
                  <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(recentLog.status)}
                      <span className="text-muted-foreground">Last run: {formatDate(recentLog.ranAt)}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {recentLog.recordsCreated} new, {recentLog.recordsUpdated} updated
                    </span>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground/60 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> No recent run logged
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </StaggerList>
      </section>

      {/* ── Recent Scrape Activity ─────────────────────── */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-display font-bold">Recent Data Updates</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Full audit trail of automated data collection. Every scrape is logged with
          timestamps, record counts, and status.
        </p>

        {loading ? (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 border-b border-border last:border-0 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-muted rounded-full" />
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-4 bg-muted rounded w-24 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length > 0 ? (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="hidden sm:grid grid-cols-5 gap-4 p-4 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
              <div>Status</div>
              <div>Source</div>
              <div>Records</div>
              <div>Duration</div>
              <div>Timestamp</div>
            </div>
            {logs.map((log) => (
              <div
                key={log.id}
                className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 p-4 border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(log.status)}
                  <span className="text-sm font-medium hidden sm:inline">{log.status}</span>
                </div>
                <div className="text-sm font-medium">{getJobLabel(log.jobName)}</div>
                <div className="text-sm text-muted-foreground">
                  <span className="text-success">{log.recordsCreated}</span>
                  {" / "}
                  <span className="text-warning">{log.recordsUpdated}</span>
                  <span className="hidden sm:inline text-muted-foreground/50"> (new/upd)</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {log.durationMs ? `${(log.durationMs / 1000).toFixed(1)}s` : "—"}
                </div>
                <div className="text-sm text-muted-foreground col-span-2 sm:col-span-1">
                  {formatDate(log.ranAt)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border border-dashed rounded-lg p-8 text-center">
            <Server className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No scrape logs available yet.</p>
          </div>
        )}
      </section>

      {/* ── Principles ────────────────────────────────── */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <HandHeart className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-display font-bold">Our Principles</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Open Source",  body: "All scrapers and data processing code is open source and available for public audit." },
            { title: "Non-Partisan", body: "We track all actions objectively — successes and failures alike — without editorial bias." },
            { title: "Verifiable",   body: "Every data point links back to its original source for independent verification." },
          ].map((p) => (
            <div key={p.title} className="bg-card border border-border rounded-lg p-5">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                {p.title}
              </h3>
              <p className="text-sm text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-foreground">Found an error or have a correction?</h3>
          <p className="text-sm text-muted-foreground mt-1">
            We welcome community feedback to improve data accuracy.
          </p>
        </div>
        <a
          href="https://github.com/rijalsawan/rspwatch/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          Submit Correction
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>

    </PageTransition>
  )
}
