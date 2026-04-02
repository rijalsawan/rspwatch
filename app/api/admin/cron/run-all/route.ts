import { NextRequest } from "next/server"
import { validateAdmin } from "@/lib/auth"
import { success, error } from "@/lib/api-response"
import { getRequestTriggerSource, isTrustedCronRequest } from "@/lib/cron-auth"
import { executeIngestionRun } from "@/scrapers/ingestion-orchestrator"
import { getAllScraperJobs } from "@/scrapers/scraper-runner"

export const maxDuration = 300

async function handleRunAll(request: NextRequest) {
  const triggerSource = getRequestTriggerSource(request)
  if (!isTrustedCronRequest(request)) {
    const authError = validateAdmin(request)
    if (authError) return authError
  }

  console.log("[cron/run-all] Running orchestrated full ingestion run...")

  try {
    const run = await executeIngestionRun({
      jobs: getAllScraperJobs(),
      runMode: "ALL",
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
    console.error("[cron/run-all] Error:", e)
    return error("Failed to run all scrapers", 500)
  }
}

// Vercel Cron invokes via GET
export async function GET(request: NextRequest) {
  return handleRunAll(request)
}

// Manual admin trigger via POST
export async function POST(request: NextRequest) {
  return handleRunAll(request)
}
