// Cron scheduler — sets up recurring scrape jobs using node-cron.
// This file should be imported at app startup (e.g., in a custom server
// or via an instrumentation hook) to activate the schedules.

import cron, { type ScheduledTask } from "node-cron"
import { SCRAPE_SCHEDULES } from "@/config/schedule"
import { shouldStartInMemoryScheduler } from "@/config/env"
import { executeIngestionRun } from "./ingestion-orchestrator"
import { isScraperJob } from "./scraper-runner"

const activeJobs: Map<string, ScheduledTask> = new Map()
let schedulerStarted = false

/**
 * Start all scheduled scrape jobs defined in config/schedule.ts.
 */
export function startScheduler(): void {
  if (!shouldStartInMemoryScheduler()) {
    console.log("[scheduler] In-memory scheduler disabled for current runtime")
    return
  }

  if (schedulerStarted) {
    console.log("[scheduler] In-memory scheduler already running")
    return
  }

  for (const schedule of SCRAPE_SCHEDULES) {
    if (schedule.runMode === "manual-only") {
      console.log(`[scheduler] Skipping manual-only job: ${schedule.jobName}`)
      continue
    }

    if (!isScraperJob(schedule.jobName)) {
      console.error(`[scheduler] Unknown job in schedule config: ${schedule.jobName}`)
      continue
    }
    const jobName = schedule.jobName

    if (!cron.validate(schedule.cron)) {
      console.error(`[scheduler] Invalid cron expression for ${schedule.jobName}: ${schedule.cron}`)
      continue
    }

    const task = cron.schedule(schedule.cron, async () => {
      console.log(`[scheduler] Running scheduled job: ${jobName}`)
      try {
        const run = await executeIngestionRun({
          jobs: [jobName],
          runMode: "SINGLE",
          triggerSource: "in-memory-scheduler",
          triggeredBy: "node-cron",
          requestedByIp: null,
        })

        if (!run.started) {
          console.warn(
            `[scheduler] Skipped ${jobName}; lock active until ${run.lockedUntil ?? "unknown"}`
          )
          return
        }

        console.log(
          `[scheduler] ${jobName} completed: ${run.status} — ` +
            `${run.recordsCreated} created, ${run.recordsUpdated} updated`
        )
      } catch (err) {
        console.error(`[scheduler] ${jobName} failed:`, err)
      }
    })

    activeJobs.set(jobName, task)
    console.log(`[scheduler] Scheduled ${jobName}: ${schedule.cron} — ${schedule.description}`)
  }

  schedulerStarted = true
}

/**
 * Stop all scheduled jobs. Call on graceful shutdown.
 */
export function stopScheduler(): void {
  for (const [name, task] of activeJobs) {
    task.stop()
    console.log(`[scheduler] Stopped ${name}`)
  }
  activeJobs.clear()
  schedulerStarted = false
}

/**
 * Check if the scheduler is running any jobs.
 */
export function isSchedulerRunning(): boolean {
  return activeJobs.size > 0
}
