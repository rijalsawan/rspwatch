import { NextRequest } from "next/server"
import { validateAdmin } from "@/lib/auth"
import { success, error } from "@/lib/api-response"
import { runScraper } from "@/scrapers/scraper-runner"

export const maxDuration = 300

const VALID_JOBS = [
  "rsp-official",
  "parliament-bills",
  "parliament-votes",
  "parliament-members",
  "kathmandu-post",
  "onlinekhabar",
]

function isCronRequest(request: NextRequest): boolean {
  if (request.headers.get("x-vercel-cron") === "1") return true
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && request.headers.get("authorization") === `Bearer ${cronSecret}`) return true
  return false
}

async function handleJob(
  request: NextRequest,
  { params }: { params: Promise<{ job: string }> }
) {
  const { job } = await params

  if (!isCronRequest(request)) {
    const authError = validateAdmin(request)
    if (authError) return authError
  }

  if (!VALID_JOBS.includes(job)) {
    return error(`Invalid job: ${job}`, 400)
  }

  console.log(`[cron/${job}] Running scraper...`)

  try {
    const result = await runScraper(job)

    console.log(
      `[cron/${job}] Completed: ${result.status} — ` +
        `${result.recordsCreated} created, ${result.recordsUpdated} updated ` +
        `(${result.durationMs}ms)`
    )

    return success({
      job,
      status: result.status,
      recordsFound: result.recordsFound,
      recordsCreated: result.recordsCreated,
      recordsUpdated: result.recordsUpdated,
      durationMs: result.durationMs,
      errors: result.errors,
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
