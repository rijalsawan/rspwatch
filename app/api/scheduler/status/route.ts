import { NextRequest } from "next/server"
import { success, error } from "@/lib/api-response"
import { SCRAPE_SCHEDULES } from "@/config/schedule"
import { prisma } from "@/lib/prisma"
import { isSchedulerRunning } from "@/scrapers/scheduler"
import { CronExpressionParser } from "cron-parser"

type SchedulerMode = "in-memory" | "vercel-free" | "disabled"

function getSchedulerMode(): SchedulerMode {
  if (process.env.DISABLE_SCHEDULER === "true") return "disabled"
  if (process.env.VERCEL === "1") return "vercel-free"
  return "in-memory"
}

function getNextRun(cronExpression: string, lastRanAt: Date | null): Date {
  try {
    const interval = CronExpressionParser.parse(cronExpression, {
      currentDate: lastRanAt || new Date(),
    })
    return interval.next().toDate()
  } catch (err) {
    console.error("[scheduler-status] Failed to parse cron:", err)
    // Fallback: return current time + 1 hour
    return new Date(Date.now() + 60 * 60 * 1000)
  }
}

export async function GET(request: NextRequest) {
  try {
    const mode = getSchedulerMode()

    // Fetch last run for each job
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
      jobs,
    })
  } catch (e) {
    console.error("[scheduler-status] Error:", e)
    return error("Failed to fetch scheduler status", 500)
  }
}
