#!/usr/bin/env npx tsx
// Run a single scraper or all scrapers from the command line
// Usage: npx tsx scripts/run-scraper.ts [scraper-name|all]
// Example: npx tsx scripts/run-scraper.ts rsp-official
// Example: npx tsx scripts/run-scraper.ts all

import "dotenv/config"
import {
  getAllScraperJobs,
  getFastScraperJobs,
  isScraperJob,
  runScraper,
} from "../scrapers/scraper-runner"

const ALL_SCRAPERS = getAllScraperJobs()
const FAST_SCRAPERS = getFastScraperJobs()
const HEAVY_SCRAPERS = ALL_SCRAPERS.filter((job) => !FAST_SCRAPERS.includes(job))

type RunnerMode = "all" | "fast" | "heavy"

function isRunnerMode(arg: string): arg is RunnerMode {
  return arg === "all" || arg === "fast" || arg === "heavy"
}

async function runBatch(mode: RunnerMode) {
  const jobs =
    mode === "all" ? ALL_SCRAPERS : mode === "fast" ? FAST_SCRAPERS : HEAVY_SCRAPERS

  console.log(`Running ${mode} scrapers...\n`)
  const results: Record<string, Awaited<ReturnType<typeof runScraper>>> = {}

  for (const job of jobs) {
    results[job] = await runScraper(job)
  }

  return results
}

async function main() {
  const arg = process.argv[2] || "all"

  console.log("═".repeat(60))
  console.log("  Parliament Watch — Scraper Runner")
  console.log("═".repeat(60))
  console.log()

  if (isRunnerMode(arg)) {
    const results = await runBatch(arg)

    console.log()
    console.log("═".repeat(60))
    console.log(`  Summary (${arg})`)
    console.log("═".repeat(60))
    for (const [name, result] of Object.entries(results)) {
      const statusIcon = result.status === "SUCCESS" ? "✓" : result.status === "PARTIAL" ? "~" : "✗"
      console.log(
        `  ${statusIcon} ${name.padEnd(20)} | ` +
        `${result.recordsCreated} created, ${result.recordsUpdated} updated | ` +
        `${result.durationMs}ms`
      )
      if (result.errors.length > 0) {
        console.log(`      Errors: ${result.errors.join(", ")}`)
      }
    }
    console.log()
  } else if (isScraperJob(arg)) {
    console.log(`Running scraper: ${arg}\n`)
    const result = await runScraper(arg)

    console.log()
    console.log("═".repeat(60))
    console.log(`  Result: ${result.status}`)
    console.log("═".repeat(60))
    console.log(`  Records found:   ${result.recordsFound}`)
    console.log(`  Records created: ${result.recordsCreated}`)
    console.log(`  Records updated: ${result.recordsUpdated}`)
    console.log(`  Duration:        ${result.durationMs}ms`)
    if (result.errors.length > 0) {
      console.log(`  Errors:          ${result.errors.join(", ")}`)
    }
    console.log()
  } else {
    console.error(`Unknown scraper: ${arg}`)
    console.error(`\nValid modes: all, fast, heavy`)
    console.error(`Valid jobs: ${ALL_SCRAPERS.join(", ")}`)
    process.exit(1)
  }

  process.exit(0)
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
