// Scraper orchestrator — runs individual or all scrapers, handles errors,
// and returns structured results for the admin API.

import { scrapeParliamentBills } from "./sources/parliament-bills"
import { scrapeParliamentVotes } from "./sources/parliament-votes"
import { scrapeParliamentMembers } from "./sources/parliament-members"
import { scrapeParliamentAppointments } from "./sources/parliament-appointments"
import { scrapeKathmanduPost } from "./sources/kathmandu-post"
import { scrapeOnlineKhabar } from "./sources/onlinekhabar"
import { scrapeRspOfficial } from "./sources/rsp-official"
// browser.ts no longer needed — all scrapers use Cheerio
import { runWithScrapeContext } from "./utils/run-context"

export interface RunResult {
  status: "SUCCESS" | "PARTIAL" | "FAILED"
  recordsFound: number
  recordsCreated: number
  recordsUpdated: number
  errors: string[]
  durationMs: number
}

export interface RunScraperOptions {
  ingestionRunId?: string
}

type ScraperFn = () => Promise<{ records: unknown[]; created: number; updated: number }>

const SCRAPERS = {
  "rsp-official": scrapeRspOfficial,
  "parliament-bills": scrapeParliamentBills,
  "parliament-votes": scrapeParliamentVotes,
  "parliament-members": scrapeParliamentMembers,
  "parliament-appointments": scrapeParliamentAppointments,
  "kathmandu-post": scrapeKathmanduPost,
  "onlinekhabar": scrapeOnlineKhabar,
} as const satisfies Record<string, ScraperFn>

export type ScraperJobName = keyof typeof SCRAPERS

const ALL_SCRAPER_JOBS = Object.keys(SCRAPERS) as ScraperJobName[]

// All scrapers use HTTP/Cheerio — no browser needed.
// Parliament scrapers use fetchRawHtml() via parliament-connectors, not Playwright.
const FAST_SCRAPER_JOBS: ScraperJobName[] = [
  "rsp-official",
  "kathmandu-post",
  "onlinekhabar",
  "parliament-bills",
  "parliament-votes",
  "parliament-members",
  "parliament-appointments",
]

function isParliamentJob(jobName: string): boolean {
  return jobName.startsWith("parliament-")
}

export function isScraperJob(jobName: string): jobName is ScraperJobName {
  return Object.prototype.hasOwnProperty.call(SCRAPERS, jobName)
}

export function getAllScraperJobs(): ScraperJobName[] {
  return [...ALL_SCRAPER_JOBS]
}

export function getFastScraperJobs(): ScraperJobName[] {
  return [...FAST_SCRAPER_JOBS]
}

/**
 * Run a single scraper by job name.
 */
export async function runScraper(
  jobName: string,
  options: RunScraperOptions = {}
): Promise<RunResult> {
  if (!isScraperJob(jobName)) {
    return {
      status: "FAILED",
      recordsFound: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      errors: [`Unknown scraper: ${jobName}`],
      durationMs: 0,
    }
  }

  const scraperFn = SCRAPERS[jobName]

  const start = Date.now()
  const context = {
    ingestionRunId: options.ingestionRunId,
    warnings: [] as string[],
  }

  try {
    const result = await runWithScrapeContext(context, async () => scraperFn())
    const durationMs = Date.now() - start

    return {
      status: context.warnings.length > 0 ? "PARTIAL" : "SUCCESS",
      recordsFound: result.records.length,
      recordsCreated: result.created,
      recordsUpdated: result.updated,
      errors: context.warnings,
      durationMs,
    }
  } catch (err) {
    const durationMs = Date.now() - start
    const errorMessage = err instanceof Error ? err.message : String(err)

    return {
      status: "FAILED",
      recordsFound: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      errors: [...context.warnings, errorMessage],
      durationMs,
    }
  } finally {
    // No-op: parliament scrapers now use Cheerio, not Playwright
  }
}

/**
 * Run only the fast (HTTP/Cheerio) scrapers — no Playwright needed.
 * Used by the Vercel free-tier cron (60s timeout).
 */
export async function runFastScrapers(
  options: RunScraperOptions = {}
): Promise<Record<string, RunResult>> {
  const results: Record<string, RunResult> = {}

  for (const jobName of FAST_SCRAPER_JOBS) {
    console.log(`[scraper-runner] Starting ${jobName}...`)
    results[jobName] = await runScraper(jobName, options)
    console.log(
      `[scraper-runner] ${jobName}: ${results[jobName].status} — ` +
      `${results[jobName].recordsCreated} created, ${results[jobName].recordsUpdated} updated ` +
      `(${results[jobName].durationMs}ms)`
    )
  }

  return results
}

/**
 * Run all scrapers sequentially. Used by the scheduler.
 */
export async function runAllScrapers(
  options: RunScraperOptions = {}
): Promise<Record<string, RunResult>> {
  const results: Record<string, RunResult> = {}

  for (const jobName of ALL_SCRAPER_JOBS) {
    console.log(`[scraper-runner] Starting ${jobName}...`)
    results[jobName] = await runScraper(jobName, options)
    console.log(
      `[scraper-runner] ${jobName}: ${results[jobName].status} — ` +
      `${results[jobName].recordsCreated} created, ${results[jobName].recordsUpdated} updated ` +
      `(${results[jobName].durationMs}ms)`
    )
  }

  return results
}
