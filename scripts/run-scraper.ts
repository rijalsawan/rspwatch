#!/usr/bin/env npx tsx
// Run a single scraper or all scrapers from the command line
// Usage: npx tsx scripts/run-scraper.ts [scraper-name|all]
// Example: npx tsx scripts/run-scraper.ts rsp-official
// Example: npx tsx scripts/run-scraper.ts all

import "dotenv/config"
import { runScraper, runAllScrapers } from "../scrapers/scraper-runner"

const VALID_SCRAPERS = [
  "rsp-official",
  "parliament-bills",
  "parliament-votes",
  "parliament-members",
  "kathmandu-post",
  "onlinekhabar",
]

async function main() {
  const arg = process.argv[2] || "all"

  console.log("═".repeat(60))
  console.log("  RSP Watch — Scraper Runner")
  console.log("═".repeat(60))
  console.log()

  if (arg === "all") {
    console.log("Running all scrapers...\n")
    const results = await runAllScrapers()

    console.log()
    console.log("═".repeat(60))
    console.log("  Summary")
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
  } else if (VALID_SCRAPERS.includes(arg)) {
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
    console.error(`\nValid options: all, ${VALID_SCRAPERS.join(", ")}`)
    process.exit(1)
  }

  process.exit(0)
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
