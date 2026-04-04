// Cron schedule definitions for all scraping jobs
// Cron format: second(optional) minute hour dayOfMonth month dayOfWeek

import { isVercelRuntime, shouldStartInMemoryScheduler } from "@/config/env"

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

export type SchedulerMode = "in-memory" | "vercel-free" | "disabled"

export function getSchedulerMode(): SchedulerMode {
  if (isVercelRuntime()) return "vercel-free"
  if (!shouldStartInMemoryScheduler()) return "disabled"
  return "in-memory"
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
    description: "Scrape bills/laws from House + National Assembly sources — Cheerio/HTTP",
    runMode: "vercel-cron",
  },
  {
    jobName: "parliament-votes",
    cron: process.env.SCRAPE_PARLIAMENT_INTERVAL ?? "0 3 * * *",
    description: "Scrape voting records from House + National Assembly sources — Cheerio/HTTP",
    runMode: "vercel-cron",
  },
  {
    jobName: "parliament-members",
    cron: "0 3 * * *",
    description: "Scrape member roster from House + National Assembly sources — Cheerio/HTTP",
    runMode: "vercel-cron",
  },
]
