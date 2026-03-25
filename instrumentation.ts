// Next.js instrumentation hook
// Runs once when the Next.js server starts (Node.js runtime only)
// Starts the in-memory cron scheduler for automatic scraping

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler, stopScheduler } = await import("@/scrapers/scheduler")

    const disableScheduler = process.env.DISABLE_SCHEDULER === "true"

    if (disableScheduler) {
      console.log("[instrumentation] Scheduler disabled via DISABLE_SCHEDULER env var")
      return
    }

    console.log("[instrumentation] Starting in-memory scheduler")
    startScheduler()

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("[instrumentation] SIGTERM received, stopping scheduler")
      stopScheduler()
    })

    process.on("SIGINT", () => {
      console.log("[instrumentation] SIGINT received, stopping scheduler")
      stopScheduler()
    })
  }
}
