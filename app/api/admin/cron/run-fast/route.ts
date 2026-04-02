// Vercel free-tier cron endpoint — runs only HTTP/Cheerio scrapers (no Playwright).
// Completes well within the 60-second serverless timeout.
// Scrapers: rsp-official, kathmandu-post, onlinekhabar
//
// Parliament scrapers (bills, votes, members) require Playwright and must be
// triggered manually via POST /api/admin/scrape/[job] from a local machine or CI.

import { NextRequest } from "next/server"
import { validateAdmin } from "@/lib/auth"
import { success, error } from "@/lib/api-response"
import { getRequestTriggerSource, isTrustedCronRequest } from "@/lib/cron-auth"
import { executeIngestionRun } from "@/scrapers/ingestion-orchestrator"
import { getFastScraperJobs } from "@/scrapers/scraper-runner"

export const maxDuration = 60

async function handleRunFast(request: NextRequest) {
  const triggerSource = getRequestTriggerSource(request)
  if (!isTrustedCronRequest(request)) {
    const authError = validateAdmin(request)
    if (authError) return authError
  }

  console.log("[cron/run-fast] Running orchestrated fast ingestion run...")

  try {
    const run = await executeIngestionRun({
      jobs: getFastScraperJobs(),
      runMode: "FAST",
      triggerSource,
      triggeredBy: triggerSource === "manual-admin" ? "admin-secret" : null,
      requestedByIp: request.headers.get("x-forwarded-for") ?? null,
    })

    if (!run.started) {
      return success(
        {
          status: "LOCKED",
          message: "Another ingestion run is already in progress",
          lockedUntil: run.lockedUntil,
        },
        undefined,
        409
      )
    }

    return success(run)
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
