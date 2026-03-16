import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { success } from "@/lib/api-response"
import { SOURCES } from "@/config/scraping"
import { SCRAPE_SCHEDULES } from "@/config/schedule"

export const dynamic = "force-dynamic"

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

const API_TABLES = [
  { name: "Members API", table: "member" },
  { name: "Laws API", table: "law" },
  { name: "Votes API", table: "vote" },
  { name: "Promises API", table: "promise" },
  { name: "Activity Feed API", table: "activityFeed" },
] as const

// GET /api/health — Full system health check
export async function GET(_request: NextRequest) {
  const services: ServiceStatus[] = []
  const scrapers: ScraperStatus[] = []
  let dbConnected = false

  // 1. Database connectivity — if this fails, skip all other DB queries
  const dbStart = Date.now()
  try {
    await prisma.$queryRawUnsafe("SELECT 1")
    dbConnected = true
    services.push({
      name: "PostgreSQL Database",
      status: "operational",
      latencyMs: Date.now() - dbStart,
      detail: null,
    })
  } catch (e) {
    const detail = e instanceof Error ? e.message : "Connection failed"
    services.push({
      name: "PostgreSQL Database",
      status: "down",
      latencyMs: Date.now() - dbStart,
      detail,
    })
  }

  if (dbConnected) {
    // 2. Prisma ORM
    const prismaStart = Date.now()
    try {
      const count = await prisma.member.count()
      services.push({
        name: "Prisma ORM",
        status: "operational",
        latencyMs: Date.now() - prismaStart,
        detail: `${count} members in database`,
      })
    } catch (e) {
      services.push({
        name: "Prisma ORM",
        status: "down",
        latencyMs: Date.now() - prismaStart,
        detail: e instanceof Error ? e.message : "Query failed",
      })
    }

    // 3. Check each API data layer
    for (const check of API_TABLES) {
      const start = Date.now()
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const count = await (prisma as any)[check.table].count()
        services.push({
          name: check.name,
          status: "operational",
          latencyMs: Date.now() - start,
          detail: `${count} records`,
        })
      } catch (e) {
        services.push({
          name: check.name,
          status: "down",
          latencyMs: Date.now() - start,
          detail: e instanceof Error ? e.message : "Query failed",
        })
      }
    }
  } else {
    // DB is down — mark everything as down without extra queries
    services.push({
      name: "Prisma ORM",
      status: "down",
      latencyMs: null,
      detail: "Skipped — database unreachable",
    })
    for (const check of API_TABLES) {
      services.push({
        name: check.name,
        status: "down",
        latencyMs: null,
        detail: "Skipped — database unreachable",
      })
    }
  }

  // 4. Scraper status from ScrapeLog (only query if DB is up)
  for (const schedule of SCRAPE_SCHEDULES) {
    const source = SOURCES[schedule.jobName]

    let lastRun = null
    if (dbConnected) {
      try {
        const log = await prisma.scrapeLog.findFirst({
          where: { jobName: schedule.jobName },
          orderBy: { ranAt: "desc" },
        })
        if (log) {
          lastRun = {
            status: log.status,
            recordsFound: log.recordsFound,
            recordsCreated: log.recordsCreated,
            recordsUpdated: log.recordsUpdated,
            durationMs: log.durationMs ?? 0,
            finishedAt: log.ranAt.toISOString(),
            errors: log.errorMessage ? [log.errorMessage] : [],
          }
        }
      } catch {
        // Table might not exist yet
      }
    }

    scrapers.push({
      jobName: schedule.jobName,
      sourceName: source?.name ?? schedule.jobName,
      engine: source?.engine ?? "cheerio",
      baseUrl: source?.baseUrl ?? "unknown",
      schedule: schedule.cron,
      scheduleDescription: schedule.description,
      lastRun,
    })
  }

  // Overall status
  const allOk = services.every((s) => s.status === "operational")
  const anyDown = services.some((s) => s.status === "down")

  return success({
    overall: anyDown ? "degraded" : allOk ? "operational" : "degraded",
    timestamp: new Date().toISOString(),
    services,
    scrapers,
  })
}
