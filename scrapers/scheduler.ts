// Cron scheduler — sets up recurring scrape jobs using node-cron.
// This file should be imported at app startup (e.g., in a custom server
// or via an instrumentation hook) to activate the schedules.

import cron, { type ScheduledTask } from "node-cron"
import { SCRAPE_SCHEDULES } from "@/config/schedule"
import { runScraper } from "./scraper-runner"

const activeJobs: Map<string, ScheduledTask> = new Map()

/**
 * Start all scheduled scrape jobs defined in config/schedule.ts.
 */
export function startScheduler(): void {
  for (const schedule of SCRAPE_SCHEDULES) {
    if (!cron.validate(schedule.cron)) {
      console.error(`[scheduler] Invalid cron expression for ${schedule.jobName}: ${schedule.cron}`)
      continue
    }

    const task = cron.schedule(schedule.cron, async () => {
      console.log(`[scheduler] Running scheduled job: ${schedule.jobName}`)
      try {
        const result = await runScraper(schedule.jobName)
        console.log(
          `[scheduler] ${schedule.jobName} completed: ${result.status} — ` +
          `${result.recordsCreated} created, ${result.recordsUpdated} updated`
        )
      } catch (err) {
        console.error(`[scheduler] ${schedule.jobName} failed:`, err)
      }
    })

    activeJobs.set(schedule.jobName, task)
    console.log(`[scheduler] Scheduled ${schedule.jobName}: ${schedule.cron} — ${schedule.description}`)
  }
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
}

/**
 * Check if the scheduler is running any jobs.
 */
export function isSchedulerRunning(): boolean {
  return activeJobs.size > 0
}
