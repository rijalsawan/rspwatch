// Vercel free-tier cron endpoint — runs only HTTP/Cheerio scrapers (no Playwright).
// Completes well within the 60-second serverless timeout.
// Scrapers: rsp-official, kathmandu-post, onlinekhabar
//
// Parliament scrapers (bills, votes, members) require Playwright and must be
// triggered manually via POST /api/admin/scrape/[job] from a local machine or CI.

import { NextRequest } from "next/server"
import { validateAdmin } from "@/lib/auth"
import { success, error } from "@/lib/api-response"
import { runFastScrapers } from "@/scrapers/scraper-runner"

export const maxDuration = 60

function isCronRequest(request: NextRequest): boolean {
  if (request.headers.get("x-vercel-cron") === "1") return true
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && request.headers.get("authorization") === `Bearer ${cronSecret}`) return true
  return false
}

async function handleRunFast(request: NextRequest) {
  if (!isCronRequest(request)) {
    const authError = validateAdmin(request)
    if (authError) return authError
  }

  console.log("[cron/run-fast] Running fast scrapers (rsp-official, kathmandu-post, onlinekhabar)...")
  const startTime = Date.now()

  try {
    const results = await runFastScrapers()
    const durationMs = Date.now() - startTime

    const totalRecordsCreated = Object.values(results).reduce(
      (sum, r) => sum + r.recordsCreated,
      0
    )
    const totalRecordsUpdated = Object.values(results).reduce(
      (sum, r) => sum + r.recordsUpdated,
      0
    )
    const failedJobs = Object.entries(results)
      .filter(([_, r]) => r.status === "FAILED")
      .map(([name]) => name)

    console.log(
      `[cron/run-fast] Completed in ${durationMs}ms — ` +
        `${totalRecordsCreated} created, ${totalRecordsUpdated} updated`
    )
    if (failedJobs.length > 0) {
      console.warn(`[cron/run-fast] Failed jobs: ${failedJobs.join(", ")}`)
    }

    return success({ totalRecordsCreated, totalRecordsUpdated, durationMs, failedJobs, results })
  } catch (e) {
    console.error("[cron/run-fast] Error:", e)
    return error("Failed to run fast scrapers", 500)
  }
}

// Vercel Cron invokes via GET
export async function GET(request: NextRequest) {
  return handleRunFast(request)
}

// Manual admin trigger via POST
export async function POST(request: NextRequest) {
  return handleRunFast(request)
}
