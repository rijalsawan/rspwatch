import { NextRequest } from "next/server"
import { validateAdmin } from "@/lib/auth"
import { success, error } from "@/lib/api-response"
import { runScraper } from "@/scrapers/scraper-runner"

// POST /api/admin/scrape/[job] — Manually trigger a specific scraper
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ job: string }> }
) {
  const authError = validateAdmin(request)
  if (authError) return authError

  try {
    const { job } = await params
    const validJobs = [
      "parliament-bills",
      "parliament-votes",
      "parliament-members",
      "kathmandu-post",
      "onlinekhabar",
    ]

    if (!validJobs.includes(job)) {
      return error(`Invalid scraper job: ${job}. Valid jobs: ${validJobs.join(", ")}`, 400)
    }

    const result = await runScraper(job)

    return success({
      job,
      status: result.status,
      recordsFound: result.recordsFound,
      recordsCreated: result.recordsCreated,
      recordsUpdated: result.recordsUpdated,
      errors: result.errors,
      durationMs: result.durationMs,
    })
  } catch (e) {
    console.error("POST /api/admin/scrape/[job] error:", e)
    return error("Scraper execution failed", 500)
  }
}
