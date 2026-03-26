"use client"

import { useCachedFetch } from "@/hooks/use-cached-fetch"
import { useState, useRef, useEffect } from "react"
import {
  Clock,
  CheckCircle2,
  XCircle,
  Zap,
  AlertCircle,
  MonitorOff,
  Play,
  Loader2,
  KeyRound,
  X,
} from "lucide-react"

interface SchedulerStatusData {
  mode: "in-memory" | "vercel-free" | "disabled"
  isRunning: boolean | null
  jobs: Array<{
    jobName: string
    description: string
    schedule: string
    runMode: "vercel-cron" | "manual-only"
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

type TriggerState =
  | { type: "idle" }
  | { type: "prompting" }
  | { type: "running" }
  | { type: "success"; created: number; updated: number; durationMs: number }
  | { type: "error"; message: string }

const SESSION_KEY = "pw_admin_secret"

export function SchedulerStatus() {
  const { data: response, loading } = useCachedFetch<{ data: SchedulerStatusData }>(
    "/api/scheduler/status"
  )
  const [adminKey, setAdminKey] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(SESSION_KEY) ?? ""
    }
    return ""
  })

  if (loading) return <SchedulerStatusSkeleton />
  if (!response?.data) return null

  const { mode, jobs } = response.data

  const modeLabel = {
    "in-memory": "In-Memory Scheduler",
    "vercel-free": "Vercel Cron (Free Tier)",
    disabled: "Disabled",
  }[mode]

  const cronJobs = jobs.filter((j) => j.runMode === "vercel-cron")
  const manualJobs = jobs.filter((j) => j.runMode === "manual-only")

  return (
    <section className="bg-card border border-border rounded-md p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold">Automated Data Collection</h2>
            <p className="text-sm text-muted-foreground">Scraper status and daily schedule</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {modeLabel}
          </span>
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
        </div>
      </div>

      {/* Daily cron jobs */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-success" />
          <span className="text-sm font-semibold text-foreground">Daily (3 AM UTC via Vercel Cron)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cronJobs.map((job) => (
            <JobCard key={job.jobName} job={job} adminKey={adminKey} onAdminKey={setAdminKey} />
          ))}
        </div>
      </div>

      {/* Manual-only jobs */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap gap-y-1">
          <MonitorOff className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Parliament Scrapers</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            Requires browser — trigger manually from here
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {manualJobs.map((job) => (
            <JobCard key={job.jobName} job={job} adminKey={adminKey} onAdminKey={setAdminKey} />
          ))}
        </div>
      </div>
    </section>
  )
}

function JobCard({
  job,
  adminKey,
  onAdminKey,
}: {
  job: SchedulerStatusData["jobs"][0]
  adminKey: string
  onAdminKey: (key: string) => void
}) {
  const isManual = job.runMode === "manual-only"
  const [triggerState, setTriggerState] = useState<TriggerState>({ type: "idle" })
  const [keyInput, setKeyInput] = useState("")
  const keyInputRef = useRef<HTMLInputElement>(null)

  // Focus key input when prompting
  useEffect(() => {
    if (triggerState.type === "prompting") {
      keyInputRef.current?.focus()
    }
  }, [triggerState.type])

  async function runScraper(key: string) {
    setTriggerState({ type: "running" })
    try {
      const res = await fetch(`/api/admin/scrape/${job.jobName}`, {
        method: "POST",
        headers: { "x-admin-secret": key },
      })
      const json = await res.json()
      if (!res.ok) {
        setTriggerState({ type: "error", message: json?.error ?? `HTTP ${res.status}` })
        return
      }
      const data = json?.data
      setTriggerState({
        type: "success",
        created: data?.recordsCreated ?? 0,
        updated: data?.recordsUpdated ?? 0,
        durationMs: data?.durationMs ?? 0,
      })
    } catch (e) {
      setTriggerState({ type: "error", message: e instanceof Error ? e.message : "Network error" })
    }
  }

  function handleTriggerClick() {
    if (adminKey) {
      runScraper(adminKey)
    } else {
      setTriggerState({ type: "prompting" })
      setKeyInput("")
    }
  }

  function handleKeySubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = keyInput.trim()
    if (!trimmed) return
    onAdminKey(trimmed)
    sessionStorage.setItem(SESSION_KEY, trimmed)
    runScraper(trimmed)
  }

  function handleDismiss() {
    setTriggerState({ type: "idle" })
    setKeyInput("")
  }

  // Time calculations
  const nextRunDate = new Date(job.nextRun)
  const now = new Date()
  const msUntilNext = nextRunDate.getTime() - now.getTime()
  const isOverdue = msUntilNext < 0
  const hoursUntil = isOverdue ? 0 : Math.floor(msUntilNext / (1000 * 60 * 60))
  const minutesUntil = isOverdue ? 0 : Math.floor((msUntilNext % (1000 * 60 * 60)) / (1000 * 60))

  const lastRunDate = job.lastRun ? new Date(job.lastRun.ranAt) : null
  const msAgo = lastRunDate ? now.getTime() - lastRunDate.getTime() : null
  const hoursAgo = msAgo !== null ? Math.floor(msAgo / (1000 * 60 * 60)) : null
  const minutesAgo = msAgo !== null ? Math.floor((msAgo % (1000 * 60 * 60)) / (1000 * 60)) : null

  const getStatusIcon = () => {
    if (triggerState.type === "success") return <CheckCircle2 className="w-4 h-4 text-success" />
    if (triggerState.type === "error") return <XCircle className="w-4 h-4 text-destructive" />
    if (!job.lastRun) return <AlertCircle className="w-4 h-4 text-muted-foreground" />
    if (job.lastRun.status === "SUCCESS") return <CheckCircle2 className="w-4 h-4 text-success" />
    if (job.lastRun.status === "PARTIAL") return <AlertCircle className="w-4 h-4 text-warning" />
    return <XCircle className="w-4 h-4 text-destructive" />
  }

  const formatTimeAgo = (): string => {
    if (hoursAgo === null) return "Never"
    if (hoursAgo === 0 && minutesAgo === 0) return "Just now"
    if (hoursAgo! > 0) {
      return minutesAgo! > 0 ? `${hoursAgo}h ${minutesAgo}m ago` : `${hoursAgo}h ago`
    }
    return `${minutesAgo}m ago`
  }

  return (
    <div className="bg-muted/30 border border-border rounded-lg p-4 flex flex-col gap-3">
      {/* Title row */}
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-foreground text-sm">{getJobLabel(job.jobName)}</h3>
        {getStatusIcon()}
      </div>

      {/* Next run (cron only) */}
      {!isManual && (
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-foreground font-medium">
            {isOverdue ? "Running soon..." : `Next: in ${hoursUntil}h ${minutesUntil}m`}
          </span>
        </div>
      )}

      {/* Last run / result */}
      <div className="pt-3 border-t border-border text-xs">
        {triggerState.type === "success" ? (
          <div className="flex justify-between text-success">
            <span>Done in {(triggerState.durationMs / 1000).toFixed(1)}s</span>
            <span>{triggerState.created} new, {triggerState.updated} updated</span>
          </div>
        ) : triggerState.type === "error" ? (
          <span className="text-destructive truncate block">{triggerState.message}</span>
        ) : job.lastRun ? (
          <div className="flex justify-between text-muted-foreground">
            <span>Last: {formatTimeAgo()}</span>
            <span>{job.lastRun.recordsCreated} new, {job.lastRun.recordsUpdated} updated</span>
          </div>
        ) : (
          <span className="text-muted-foreground">No runs yet</span>
        )}
      </div>

      {/* Trigger button for manual scrapers */}
      {isManual && triggerState.type !== "prompting" && (
        <button
          onClick={handleTriggerClick}
          disabled={triggerState.type === "running"}
          className="flex items-center justify-center gap-2 text-xs font-medium px-3 py-2 rounded-md
            bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {triggerState.type === "running" ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Running...
            </>
          ) : (
            <>
              {adminKey ? <Play className="w-3.5 h-3.5" /> : <KeyRound className="w-3.5 h-3.5" />}
              {adminKey ? "Run Now" : "Run Now"}
            </>
          )}
        </button>
      )}

      {/* Inline admin key prompt */}
      {isManual && triggerState.type === "prompting" && (
        <form onSubmit={handleKeySubmit} className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Enter admin key to run</span>
          </div>
          <div className="flex gap-2">
            <input
              ref={keyInputRef}
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Admin secret"
              className="flex-1 text-xs px-2.5 py-1.5 rounded-md border border-border bg-background
                focus:outline-none focus:ring-1 focus:ring-primary/50 min-w-0"
            />
            <button
              type="submit"
              disabled={!keyInput.trim()}
              className="text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground
                hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              Run
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded" />
        ))}
      </div>
    </div>
  )
}
