"use client"

import { useEffect, useState, useCallback } from "react"
import { PageTransition } from "@/components/animations/PageTransition"
import { StaggerList } from "@/components/animations/StaggerList"
import { StatusBadge, StatusType } from "@/components/shared/StatusBadge"
import {
  Database,
  Server,
  Globe,
  RefreshCw,
  Clock,
  Activity,
  Cpu,
  Newspaper,
  Landmark,
  Users,
  Scale,
  Vote,
  HandCoins,
  Rss,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react"

interface ServiceStatus {
  name: string
  status: "operational" | "degraded" | "down"
  latencyMs: number | null
  detail: string | null
}

interface ScraperStatus {
  jobName: string
  sourceName: string
  engine: "playwright" | "cheerio"
  baseUrl: string
  schedule: string
  scheduleDescription: string
  lastRun: {
    status: string
    recordsFound: number
    recordsCreated: number
    recordsUpdated: number
    durationMs: number
    finishedAt: string
    errors: string[]
  } | null
}

interface HealthData {
  overall: "operational" | "degraded" | "down"
  timestamp: string
  services: ServiceStatus[]
  scrapers: ScraperStatus[]
}

const SERVICE_ICONS: Record<string, React.ElementType> = {
  "PostgreSQL Database": Database,
  "Prisma ORM": Cpu,
  "Members API": Users,
  "Laws API": Scale,
  "Votes API": Vote,
  "Promises API": HandCoins,
  "Activity Feed API": Rss,
}

const SCRAPER_ICONS: Record<string, React.ElementType> = {
  "parliament-bills": Landmark,
  "parliament-votes": Vote,
  "parliament-members": Users,
  "kathmandu-post": Newspaper,
  "onlinekhabar": Globe,
}

function statusToType(status: string): StatusType {
  if (status === "operational" || status === "SUCCESS") return "success"
  if (status === "degraded" || status === "PARTIAL") return "warning"
  return "destructive"
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function TestPage() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const fetchHealth = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/health")
      const json = await res.json()
      if (json.data) {
        setHealth(json.data)
        setLastChecked(new Date())
      } else {
        setError(json.error ?? "Unknown error")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 30000) // auto-refresh every 30s
    return () => clearInterval(interval)
  }, [fetchHealth])

  const operationalCount = health?.services.filter((s) => s.status === "operational").length ?? 0
  const totalCount = health?.services.length ?? 0

  return (
    <PageTransition className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-10 w-full">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-primary" />
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
              System Status
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Real-time health of backend services and web scrapers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastChecked && (
            <span className="text-xs text-muted-foreground">
              Last checked {formatTimeAgo(lastChecked.toISOString())}
            </span>
          )}
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-md text-sm font-medium hover:border-primary/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </section>

      {/* Overall status banner */}
      {health && (
        <div
          className={`flex items-center gap-4 p-5 rounded-md border ${
            health.overall === "operational"
              ? "bg-success/5 border-success/20"
              : health.overall === "degraded"
                ? "bg-warning/5 border-warning/20"
                : "bg-destructive/5 border-destructive/20"
          }`}
        >
          {health.overall === "operational" ? (
            <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
          ) : health.overall === "degraded" ? (
            <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0" />
          ) : (
            <XCircle className="w-6 h-6 text-destructive flex-shrink-0" />
          )}
          <div className="flex flex-col gap-0.5 flex-1">
            <span className="font-display font-bold text-lg">
              {health.overall === "operational"
                ? "All Systems Operational"
                : health.overall === "degraded"
                  ? "Partial System Degradation"
                  : "System Outage Detected"}
            </span>
            <span className="text-sm text-muted-foreground">
              {operationalCount} of {totalCount} services running
            </span>
          </div>
          <StatusBadge status={statusToType(health.overall)} pulse>
            {health.overall}
          </StatusBadge>
        </div>
      )}

      {/* Error state */}
      {error && !health && (
        <div className="flex items-center gap-4 p-5 rounded-md border bg-destructive/5 border-destructive/20">
          <XCircle className="w-6 h-6 text-destructive flex-shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="font-display font-bold text-lg">Connection Failed</span>
            <span className="text-sm text-muted-foreground">{error}</span>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !health && (
        <div className="flex flex-col gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-md p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-md bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {health && (
        <>
          {/* Backend Services */}
          <section className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-2xl font-display font-bold">Backend Services</h2>
            </div>

            <StaggerList className="flex flex-col gap-3">
              {health.services.map((service) => {
                const Icon = SERVICE_ICONS[service.name] ?? Server
                return (
                  <div
                    key={service.name}
                    className="bg-card border border-border rounded-md p-5 flex items-center gap-4 hover:border-primary/50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-md bg-muted/50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-semibold text-foreground truncate">
                          {service.name}
                        </span>
                      </div>
                      {service.detail && (
                        <span className="text-xs text-muted-foreground">{service.detail}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      {service.latencyMs !== null && (
                        <span className="text-xs text-muted-foreground font-mono hidden sm:block">
                          {formatMs(service.latencyMs)}
                        </span>
                      )}
                      <StatusBadge status={statusToType(service.status)}>
                        {service.status}
                      </StatusBadge>
                    </div>
                  </div>
                )
              })}
            </StaggerList>
          </section>

          {/* Web Scrapers */}
          <section className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-2xl font-display font-bold">Web Scrapers</h2>
            </div>

            <StaggerList className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {health.scrapers.map((scraper) => {
                const Icon = SCRAPER_ICONS[scraper.jobName] ?? Globe
                const hasRun = scraper.lastRun !== null

                return (
                  <div
                    key={scraper.jobName}
                    className="bg-card border border-border rounded-md p-5 flex flex-col gap-4 hover:border-primary/50 transition-colors group"
                  >
                    {/* Scraper header */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-md bg-muted/50 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-display font-semibold text-foreground block truncate">
                          {scraper.sourceName}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {scraper.baseUrl}
                        </span>
                      </div>
                      <StatusBadge
                        status={
                          hasRun
                            ? statusToType(scraper.lastRun!.status)
                            : "neutral"
                        }
                      >
                        {hasRun ? scraper.lastRun!.status : "NO RUNS"}
                      </StatusBadge>
                    </div>

                    {/* Metadata row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Cpu className="w-3 h-3" />
                        {scraper.engine}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {scraper.schedule}
                      </span>
                      {hasRun && (
                        <span className="inline-flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" />
                          {formatTimeAgo(scraper.lastRun!.finishedAt)}
                        </span>
                      )}
                    </div>

                    {/* Last run stats */}
                    {hasRun && (
                      <div className="grid grid-cols-4 gap-2 border-t border-border pt-3">
                        {[
                          { label: "Found", value: scraper.lastRun!.recordsFound },
                          { label: "Created", value: scraper.lastRun!.recordsCreated },
                          { label: "Updated", value: scraper.lastRun!.recordsUpdated },
                          { label: "Duration", value: formatMs(scraper.lastRun!.durationMs) },
                        ].map((stat) => (
                          <div key={stat.label} className="flex flex-col items-center gap-0.5">
                            <span className="text-lg font-bold font-display text-foreground">
                              {stat.value}
                            </span>
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                              {stat.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Errors */}
                    {hasRun && scraper.lastRun!.errors.length > 0 && (
                      <div className="bg-destructive/5 border border-destructive/20 rounded-sm p-3">
                        <span className="text-xs font-semibold text-destructive uppercase tracking-wide block mb-1">
                          Errors
                        </span>
                        {scraper.lastRun!.errors.map((err, i) => (
                          <p key={i} className="text-xs text-destructive/80 font-mono break-all">
                            {err}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* No runs message */}
                    {!hasRun && (
                      <div className="bg-muted/50 border border-border rounded-sm p-3 text-center">
                        <span className="text-xs text-muted-foreground">
                          No scrape runs recorded yet. Trigger manually via admin API or wait for
                          scheduled run.
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </StaggerList>
          </section>

          {/* Timestamp footer */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground border-t border-border pt-6">
            <Clock className="w-3 h-3" />
            <span>
              Data as of{" "}
              {new Date(health.timestamp).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "medium",
              })}
            </span>
            <span className="text-border">|</span>
            <span>Auto-refreshes every 30s</span>
          </div>
        </>
      )}
    </PageTransition>
  )
}
