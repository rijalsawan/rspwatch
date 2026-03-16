// Per-source scraping configuration: rate limits, base URLs, selectors

export interface SourceConfig {
  name: string
  baseUrl: string
  requestDelayMs: number
  maxRetries: number
  engine: "playwright" | "cheerio"
  userAgent?: string
}

const defaultDelay = parseInt(process.env.SCRAPE_REQUEST_DELAY_MS ?? "2000", 10)
const defaultRetries = parseInt(process.env.SCRAPE_MAX_RETRIES ?? "3", 10)

export const SOURCES: Record<string, SourceConfig> = {
  "parliament-bills": {
    name: "Parliament of Nepal — Bills",
    baseUrl: "https://parliament.gov.np",
    requestDelayMs: defaultDelay,
    maxRetries: defaultRetries,
    engine: "playwright",
  },
  "parliament-votes": {
    name: "Parliament of Nepal — Votes",
    baseUrl: "https://parliament.gov.np",
    requestDelayMs: defaultDelay,
    maxRetries: defaultRetries,
    engine: "playwright",
  },
  "parliament-members": {
    name: "Parliament of Nepal — Members",
    baseUrl: "https://parliament.gov.np",
    requestDelayMs: defaultDelay,
    maxRetries: defaultRetries,
    engine: "playwright",
  },
  "kathmandu-post": {
    name: "The Kathmandu Post",
    baseUrl: "https://kathmandupost.com",
    requestDelayMs: 3000, // more conservative for news sites
    maxRetries: defaultRetries,
    engine: "cheerio",
  },
  "onlinekhabar": {
    name: "OnlineKhabar",
    baseUrl: "https://english.onlinekhabar.com",
    requestDelayMs: 3000,
    maxRetries: defaultRetries,
    engine: "cheerio",
  },
}
