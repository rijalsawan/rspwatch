// Cron schedule definitions for all scraping jobs
// Cron format: second(optional) minute hour dayOfMonth month dayOfWeek

export interface ScheduleEntry {
  jobName: string
  cron: string
  description: string
}

export const SCRAPE_SCHEDULES: ScheduleEntry[] = [
  {
    jobName: "parliament-bills",
    cron: process.env.SCRAPE_PARLIAMENT_INTERVAL ?? "0 */6 * * *",
    description: "Scrape bills/laws from parliament.gov.np every 6 hours",
  },
  {
    jobName: "parliament-votes",
    cron: process.env.SCRAPE_PARLIAMENT_INTERVAL ?? "0 */6 * * *",
    description: "Scrape voting records from parliament.gov.np every 6 hours",
  },
  {
    jobName: "parliament-members",
    cron: "0 0 */12 * *", // twice daily — member list rarely changes
    description: "Scrape MP list from parliament.gov.np every 12 hours",
  },
  {
    jobName: "kathmandu-post",
    cron: process.env.SCRAPE_NEWS_INTERVAL ?? "0 */2 * * *",
    description: "Scrape RSP-related news from kathmandupost.com every 2 hours",
  },
  {
    jobName: "onlinekhabar",
    cron: process.env.SCRAPE_NEWS_INTERVAL ?? "0 */2 * * *",
    description: "Scrape RSP-related news from onlinekhabar.com every 2 hours",
  },
  {
    jobName: "rsp-official",
    cron: "0 */4 * * *",
    description: "Scrape RSP official website (press, members, timeline) every 4 hours",
  },
]
