import { success, error } from "@/lib/api-response"
import { SCRAPE_SCHEDULES, getSchedulerMode } from "@/config/schedule"
import { prisma } from "@/lib/prisma"
import { isSchedulerRunning } from "@/scrapers/scheduler"
import { CronExpressionParser } from "cron-parser"

function getNextRun(cronExpression: string, lastRanAt: Date | null): Date {
  try {
    const interval = CronExpressionParser.parse(cronExpression, {
      currentDate: lastRanAt || new Date(),
    })
    return interval.next().toDate()
  } catch (err) {
    console.error("[scheduler-status] Failed to parse cron:", err)
    return new Date(Date.now() + 60 * 60 * 1000)
  }
}

export async function GET() {
  try {
    const mode = getSchedulerMode()

    const [latestRun, lock] = await Promise.all([
      prisma.ingestionRun
        .findFirst({
          orderBy: { startedAt: "desc" },
          select: {
            id: true,
            mode: true,
            status: true,
            triggerSource: true,
            startedAt: true,
            endedAt: true,
            durationMs: true,
            totalJobs: true,
            failedJobs: true,
            recordsCreated: true,
            recordsUpdated: true,
          },
        })
        .catch(() => null),
      prisma.ingestionLock
        .findUnique({
          where: { key: "global-scrape-lock" },
          select: {
            ownerToken: true,
            lockedUntil: true,
            updatedAt: true,
          },
        })
        .catch(() => null),
    ])

    const jobs = await Promise.all(
      SCRAPE_SCHEDULES.map(async (schedule) => {
        const lastRun = await prisma.scrapeLog.findFirst({
          where: { jobName: schedule.jobName },
          orderBy: { ranAt: "desc" },
          select: {
            status: true,
            ranAt: true,
            recordsCreated: true,
            recordsUpdated: true,
            durationMs: true,
          },
        })

        const nextRun = getNextRun(schedule.cron, lastRun?.ranAt || null)

        return {
          jobName: schedule.jobName,
          description: schedule.description,
          schedule: schedule.cron,
          runMode: schedule.runMode,
          nextRun: nextRun.toISOString(),
          lastRun: lastRun
            ? {
                status: lastRun.status,
                ranAt: lastRun.ranAt.toISOString(),
                recordsCreated: lastRun.recordsCreated,
                recordsUpdated: lastRun.recordsUpdated,
                durationMs: lastRun.durationMs,
              }
            : null,
        }
      })
    )

    return success({
      mode,
      isRunning: mode === "in-memory" ? isSchedulerRunning() : null,
      lock: lock
        ? {
            isLocked: lock.lockedUntil.getTime() > Date.now(),
            lockedUntil: lock.lockedUntil.toISOString(),
            updatedAt: lock.updatedAt.toISOString(),
            ownerPresent: Boolean(lock.ownerToken),
          }
        : null,
      latestRun: latestRun
        ? {
            id: latestRun.id,
            mode: latestRun.mode,
            status: latestRun.status,
            triggerSource: latestRun.triggerSource,
            startedAt: latestRun.startedAt.toISOString(),
            endedAt: latestRun.endedAt ? latestRun.endedAt.toISOString() : null,
            durationMs: latestRun.durationMs,
            totalJobs: latestRun.totalJobs,
            failedJobs: latestRun.failedJobs,
            recordsCreated: latestRun.recordsCreated,
            recordsUpdated: latestRun.recordsUpdated,
          }
        : null,
      jobs,
    })
  } catch (e) {
    console.error("[scheduler-status] Error:", e)
    return error("Failed to fetch scheduler status", 500)
  }
}
