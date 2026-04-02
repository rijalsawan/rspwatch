import { NextRequest } from "next/server"
import { validateAdmin } from "@/lib/auth"
import { success, error } from "@/lib/api-response"
import { getRequestTriggerSource, isTrustedCronRequest } from "@/lib/cron-auth"
import { executeIngestionRun } from "@/scrapers/ingestion-orchestrator"
import { isScraperJob } from "@/scrapers/scraper-runner"

export const maxDuration = 300

async function handleJob(
  request: NextRequest,
  { params }: { params: Promise<{ job: string }> }
) {
  const { job } = await params

  const triggerSource = getRequestTriggerSource(request)
  if (!isTrustedCronRequest(request)) {
    const authError = validateAdmin(request)
    if (authError) return authError
  }

  if (!isScraperJob(job)) {
    return error(`Invalid job: ${job}`, 400)
  }

  console.log(`[cron/${job}] Running orchestrated single-job ingestion run...`)

  try {
    const run = await executeIngestionRun({
      jobs: [job],
      runMode: "SINGLE",
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

    return success({
      job,
      runId: run.runId,
      status: run.status,
      recordsCreated: run.recordsCreated,
      recordsUpdated: run.recordsUpdated,
      durationMs: run.durationMs,
      failedJobs: run.failedJobs,
      results: run.results,
    })
  } catch (e) {
    console.error(`[cron/${job}] Error:`, e)
    return error("Scraper execution failed", 500)
  }
}

// Vercel Cron invokes via GET
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ job: string }> }
) {
  return handleJob(request, context)
}

// Manual admin trigger via POST
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ job: string }> }
) {
  return handleJob(request, context)
}
