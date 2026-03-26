// Cron schedule definitions for all scraping jobs
// Cron format: second(optional) minute hour dayOfMonth month dayOfWeek

export interface ScheduleEntry {
  jobName: string
  cron: string
  description: string
  /**
   * "vercel-cron" — runs automatically every day via Vercel's free-tier cron (no Playwright needed)
   * "manual-only"  — requires Playwright; must be triggered manually or via external CI
   */
  runMode: "vercel-cron" | "manual-only"
}

export const SCRAPE_SCHEDULES: ScheduleEntry[] = [
  // ── Vercel cron (daily at 3 AM UTC) — HTTP/Cheerio only, no browser ──
  {
    jobName: "rsp-official",
    cron: "0 3 * * *",
    description: "Scrape RSP official website (press, members, timeline) — runs via Vercel cron",
    runMode: "vercel-cron",
  },
  {
    jobName: "kathmandu-post",
    cron: "0 3 * * *",
    description: "Scrape RSP-related news from kathmandupost.com — runs via Vercel cron",
    runMode: "vercel-cron",
  },
  {
    jobName: "onlinekhabar",
    cron: "0 3 * * *",
    description: "Scrape RSP-related news from onlinekhabar.com — runs via Vercel cron",
    runMode: "vercel-cron",
  },

  // ── Manual only — require Playwright browser (cannot run on Vercel free tier) ──
  {
    jobName: "parliament-bills",
    cron: process.env.SCRAPE_PARLIAMENT_INTERVAL ?? "0 3 * * *",
    description: "Scrape bills/laws from parliament.gov.np — requires Playwright, trigger manually",
    runMode: "manual-only",
  },
  {
    jobName: "parliament-votes",
    cron: process.env.SCRAPE_PARLIAMENT_INTERVAL ?? "0 3 * * *",
    description: "Scrape voting records from parliament.gov.np — requires Playwright, trigger manually",
    runMode: "manual-only",
  },
  {
    jobName: "parliament-members",
    cron: "0 3 * * *",
    description: "Scrape MP list from parliament.gov.np — requires Playwright, trigger manually",
    runMode: "manual-only",
  },
]
