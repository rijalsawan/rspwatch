import { NextRequest } from "next/server"
import { validateAdmin } from "@/lib/auth"
import { success, error } from "@/lib/api-response"
import { runScraper } from "@/scrapers/scraper-runner"

const VALID_JOBS = [
  "rsp-official",
  "parliament-bills",
  "parliament-votes",
  "parliament-members",
  "kathmandu-post",
  "onlinekhabar",
]

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ job: string }> }
) {
  const { job } = await params

  // Auth: Vercel Cron header OR admin secret
  const isVercelCron = request.headers.get("x-vercel-cron") === "1"
  if (!isVercelCron) {
    const authError = validateAdmin(request)
    if (authError) return authError
  }

  // Validate job name
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
