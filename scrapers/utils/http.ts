// Shared HTTP fetcher for static HTML scraping with Cheerio.
// Includes retry logic, configurable delays, and rate limiting.

import * as cheerio from "cheerio"

interface FetchOptions {
  retries?: number
  delayMs?: number
  headers?: Record<string, string>
}

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (compatible; ParliamentWatchBot/1.0; +https://parliamentwatch.np)"

/**
 * Fetch a URL and return a Cheerio instance for HTML parsing.
 * Retries on transient failures with configurable backoff.
 */
export async function fetchPage(
  url: string,
  opts: FetchOptions = {}
) {
  const { retries = 3, delayMs = 2000, headers = {} } = opts
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": DEFAULT_USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
          ...headers,
        },
        signal: AbortSignal.timeout(30000),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()
      return cheerio.load(html)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < retries) {
        console.warn(`Fetch attempt ${attempt}/${retries} failed for ${url}: ${lastError.message}`)
        await sleep(delayMs * attempt) // linear backoff
      }
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${url}`)
}

/**
 * Fetch raw HTML as a string (for auditing / raw storage).
 */
export async function fetchRawHtml(
  url: string,
  opts: FetchOptions = {}
): Promise<string> {
  const { retries = 3, delayMs = 2000, headers = {} } = opts

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": DEFAULT_USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
          ...headers,
        },
        signal: AbortSignal.timeout(30000),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.text()
    } catch (err) {
      if (attempt === retries) throw err
      await sleep(delayMs * attempt)
    }
  }

  throw new Error(`Failed to fetch ${url}`)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
