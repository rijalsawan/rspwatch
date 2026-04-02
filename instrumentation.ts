// Next.js instrumentation hook
// Runs once when the Next.js server starts (Node.js runtime only)
// Starts the in-memory cron scheduler for automatic scraping

import { shouldStartInMemoryScheduler } from "@/config/env"

let shutdownHandlersRegistered = false

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (!shouldStartInMemoryScheduler()) {
      console.log("[instrumentation] In-memory scheduler disabled for this runtime")
      return
    }

    const { startScheduler, stopScheduler } = await import("@/scrapers/scheduler")

    console.log("[instrumentation] Starting in-memory scheduler")
    startScheduler()

    if (!shutdownHandlersRegistered) {
      // Graceful shutdown
      process.on("SIGTERM", () => {
        console.log("[instrumentation] SIGTERM received, stopping scheduler")
        stopScheduler()
      })

      process.on("SIGINT", () => {
        console.log("[instrumentation] SIGINT received, stopping scheduler")
        stopScheduler()
      })

      shutdownHandlersRegistered = true
    }
  }
}
