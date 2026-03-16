// Scraper orchestrator — runs individual or all scrapers, handles errors,
// and returns structured results for the admin API.

import { scrapeParliamentBills } from "./sources/parliament-bills"
import { scrapeParliamentVotes } from "./sources/parliament-votes"
import { scrapeParliamentMembers } from "./sources/parliament-members"
import { scrapeKathmanduPost } from "./sources/kathmandu-post"
import { scrapeOnlineKhabar } from "./sources/onlinekhabar"
import { closeBrowser } from "./utils/browser"
import { logScrapeRun } from "./utils/logger"

export interface RunResult {
  status: "SUCCESS" | "PARTIAL" | "FAILED"
  recordsFound: number
  recordsCreated: number
  recordsUpdated: number
  errors: string[]
  durationMs: number
}

type ScraperFn = () => Promise<{ records: unknown[]; created: number; updated: number }>

const SCRAPERS: Record<string, ScraperFn> = {
  "parliament-bills": scrapeParliamentBills,
  "parliament-votes": scrapeParliamentVotes,
  "parliament-members": scrapeParliamentMembers,
  "kathmandu-post": scrapeKathmanduPost,
  "onlinekhabar": scrapeOnlineKhabar,
}

/**
 * Run a single scraper by job name.
 */
export async function runScraper(jobName: string): Promise<RunResult> {
  const scraperFn = SCRAPERS[jobName]
  if (!scraperFn) {
    return {
      status: "FAILED",
      recordsFound: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      errors: [`Unknown scraper: ${jobName}`],
      durationMs: 0,
    }
  }

  const start = Date.now()
  try {
    const result = await scraperFn()
    const durationMs = Date.now() - start

    return {
      status: "SUCCESS",
      recordsFound: result.records.length,
      recordsCreated: result.created,
      recordsUpdated: result.updated,
      errors: [],
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
      errors: [errorMessage],
      durationMs,
    }
  } finally {
    // Close shared browser if a Playwright scraper was used
    if (jobName.startsWith("parliament-")) {
      await closeBrowser().catch(() => {})
    }
  }
}

/**
 * Run all scrapers sequentially. Used by the scheduler.
 */
export async function runAllScrapers(): Promise<Record<string, RunResult>> {
  const results: Record<string, RunResult> = {}

  for (const jobName of Object.keys(SCRAPERS)) {
    console.log(`[scraper-runner] Starting ${jobName}...`)
    results[jobName] = await runScraper(jobName)
    console.log(
      `[scraper-runner] ${jobName}: ${results[jobName].status} — ` +
      `${results[jobName].recordsCreated} created, ${results[jobName].recordsUpdated} updated ` +
      `(${results[jobName].durationMs}ms)`
    )
  }

  // Always clean up browser
  await closeBrowser().catch(() => {})

  return results
}
