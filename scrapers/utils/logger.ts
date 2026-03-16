// Scrape logger — writes structured logs to the ScrapeLog table.

import { prisma } from "@/lib/prisma"
import type { ScrapeStatus } from "@prisma/client"

interface LogEntry {
  jobName: string
  sourceUrl?: string
  status: ScrapeStatus
  recordsFound?: number
  recordsCreated?: number
  recordsUpdated?: number
  errorMessage?: string
  rawHtml?: string
  durationMs?: number
}

export async function logScrapeRun(entry: LogEntry): Promise<void> {
  try {
    await prisma.scrapeLog.create({
      data: {
        jobName: entry.jobName,
        sourceUrl: entry.sourceUrl,
        status: entry.status,
        recordsFound: entry.recordsFound ?? 0,
        recordsCreated: entry.recordsCreated ?? 0,
        recordsUpdated: entry.recordsUpdated ?? 0,
        errorMessage: entry.errorMessage,
        rawHtml: entry.rawHtml,
        durationMs: entry.durationMs,
      },
    })
  } catch (err) {
    // Never let logging failure crash the scraper
    console.error("Failed to log scrape run:", err)
  }
}

/**
 * Wraps a scraper function with automatic timing and logging.
 */
export async function withScrapeLogging<T>(
  jobName: string,
  sourceUrl: string,
  fn: () => Promise<{ records: T[]; created: number; updated: number; rawHtml?: string }>
): Promise<{ records: T[]; created: number; updated: number }> {
  const start = Date.now()
  try {
    const result = await fn()
    const durationMs = Date.now() - start

    await logScrapeRun({
      jobName,
      sourceUrl,
      status: "SUCCESS",
      recordsFound: result.records.length,
      recordsCreated: result.created,
      recordsUpdated: result.updated,
      rawHtml: result.rawHtml,
      durationMs,
    })

    return result
  } catch (err) {
    const durationMs = Date.now() - start
    const errorMessage = err instanceof Error ? err.message : String(err)

    await logScrapeRun({
      jobName,
      sourceUrl,
      status: "FAILED",
      errorMessage,
      durationMs,
    })

    throw err
  }
}
