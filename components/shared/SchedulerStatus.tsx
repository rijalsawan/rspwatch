"use client"

import { useCachedFetch } from "@/hooks/use-cached-fetch"
import { Clock, CheckCircle2, XCircle, Zap, AlertCircle } from "lucide-react"

interface SchedulerStatusData {
  mode: "in-memory" | "vercel-free" | "disabled"
  isRunning: boolean | null
  jobs: Array<{
    jobName: string
    description: string
    schedule: string
    nextRun: string
    lastRun: {
      status: string
      ranAt: string
      recordsCreated: number
      recordsUpdated: number
      durationMs: number | null
    } | null
  }>
}

export function SchedulerStatus() {
  const { data: response, loading } = useCachedFetch<{ data: SchedulerStatusData }>(
    "/api/scheduler/status"
  )

  if (loading) return <SchedulerStatusSkeleton />
  if (!response?.data) return null

  const { mode, isRunning, jobs } = response.data

  const modeLabel = {
    "in-memory": "In-Memory Scheduler",
    "vercel-free": "Vercel Cron (Free)",
    disabled: "Disabled",
  }[mode]

  const isActive = mode !== "disabled" && (mode === "vercel-free" || isRunning === true)

  return (
    <section className="bg-card border border-border rounded-md p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold">Automated Data Collection</h2>
            <p className="text-sm text-muted-foreground">Real-time scraper status and schedules</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {modeLabel}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              isActive ? "bg-success animate-pulse" : "bg-muted-foreground"
            }`}
          />
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((job) => (
          <JobCard key={job.jobName} job={job} />
        ))}
      </div>
    </section>
  )
}

function JobCard({
  job,
}: {
  job: SchedulerStatusData["jobs"][0]
}) {
  // Calculate countdown
  const nextRunDate = new Date(job.nextRun)
  const now = new Date()
  const msUntilNext = nextRunDate.getTime() - now.getTime()

  // Don't show negative times
  const isOverdue = msUntilNext < 0
  const hoursUntil = isOverdue ? 0 : Math.floor(msUntilNext / (1000 * 60 * 60))
  const minutesUntil = isOverdue ? 0 : Math.floor((msUntilNext % (1000 * 60 * 60)) / (1000 * 60))

  // Calculate time ago
  const lastRunDate = job.lastRun ? new Date(job.lastRun.ranAt) : null
  const msAgo = lastRunDate ? now.getTime() - lastRunDate.getTime() : null
  const hoursAgo = msAgo ? Math.floor(msAgo / (1000 * 60 * 60)) : null
  const minutesAgo = msAgo ? Math.floor((msAgo % (1000 * 60 * 60)) / (1000 * 60)) : null

  const getStatusIcon = () => {
    if (!job.lastRun) return <AlertCircle className="w-4 h-4 text-muted-foreground" />
    if (job.lastRun.status === "SUCCESS") return <CheckCircle2 className="w-4 h-4 text-success" />
    if (job.lastRun.status === "PARTIAL") return <AlertCircle className="w-4 h-4 text-warning" />
    return <XCircle className="w-4 h-4 text-destructive" />
  }

  const formatTimeAgo = (): string => {
    if (!hoursAgo && !minutesAgo) return "Just now"
    if (hoursAgo && hoursAgo > 0) {
      if (minutesAgo && minutesAgo > 0) return `${hoursAgo}h ${minutesAgo}m ago`
      return `${hoursAgo}h ago`
    }
    return `${minutesAgo}m ago`
  }

  return (
    <div className="bg-muted/30 border border-border rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-foreground">{getJobLabel(job.jobName)}</h3>
        {getStatusIcon()}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <Clock className="w-4 h-4 text-primary" />
        <span className="text-foreground font-medium">
          {isOverdue ? "Running soon..." : `Next: in ${hoursUntil}h ${minutesUntil}m`}
        </span>
      </div>

      {job.lastRun && (
        <div className="pt-3 border-t border-border flex justify-between text-xs">
          <span className="text-muted-foreground">Last: {formatTimeAgo()}</span>
          <span className="text-muted-foreground">
            {job.lastRun.recordsCreated} new, {job.lastRun.recordsUpdated} updated
          </span>
        </div>
      )}

      {!job.lastRun && (
        <div className="pt-3 border-t border-border text-xs text-muted-foreground">
          No runs yet
        </div>
      )}
    </div>
  )
}

function getJobLabel(jobName: string): string {
  const labels: Record<string, string> = {
    "parliament-bills": "Parliament Bills",
    "parliament-votes": "Parliament Votes",
    "parliament-members": "Parliament Members",
    "kathmandu-post": "Kathmandu Post",
    onlinekhabar: "OnlineKhabar",
    "rsp-official": "RSP Official",
  }
  return labels[jobName] ?? jobName
}

function SchedulerStatusSkeleton() {
  return (
    <div className="bg-card border border-border rounded-md p-6 animate-pulse">
      <div className="h-10 bg-muted rounded w-64 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded" />
        ))}
      </div>
    </div>
  )
}
