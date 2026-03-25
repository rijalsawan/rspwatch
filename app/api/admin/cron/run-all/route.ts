import { NextRequest } from "next/server"
import { validateAdmin } from "@/lib/auth"
import { success, error } from "@/lib/api-response"
import { runAllScrapers } from "@/scrapers/scraper-runner"

export async function POST(request: NextRequest) {
  // Auth: Vercel Cron header OR admin secret
  const isVercelCron = request.headers.get("x-vercel-cron") === "1"
  if (!isVercelCron) {
    const authError = validateAdmin(request)
    if (authError) return authError
  }

  console.log("[cron/run-all] Running all scrapers...")

  const startTime = Date.now()

  try {
    const results = await runAllScrapers()
    const durationMs = Date.now() - startTime

    // Calculate totals
    const totalRecordsCreated = Object.values(results).reduce(
      (sum, r) => sum + r.recordsCreated,
      0
    )
    const totalRecordsUpdated = Object.values(results).reduce(
      (sum, r) => sum + r.recordsUpdated,
      0
    )

    // Check for failures
    const failedJobs = Object.entries(results)
      .filter(([_, r]) => r.status === "FAILED")
      .map(([name]) => name)

    console.log(
      `[cron/run-all] Completed in ${durationMs}ms — ` +
        `${totalRecordsCreated} created, ${totalRecordsUpdated} updated`
    )

    if (failedJobs.length > 0) {
      console.warn(`[cron/run-all] Failed jobs: ${failedJobs.join(", ")}`)
    }

    return success({
      totalRecordsCreated,
      totalRecordsUpdated,
      durationMs,
      failedJobs,
      results,
    })
  } catch (e) {
    console.error("[cron/run-all] Error:", e)
    return error("Failed to run all scrapers", 500)
  }
}
