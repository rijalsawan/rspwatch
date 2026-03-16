// Shared Playwright browser singleton for JS-rendered page scraping.
// Uses a single browser instance across all scrapers to conserve resources.

import type { Browser, Page } from "playwright"

let browserInstance: Browser | null = null

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    // Dynamic import — playwright is heavy, only load when scraping
    const { chromium } = await import("playwright")
    browserInstance = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
  }
  return browserInstance
}

export async function getPage(): Promise<Page> {
  const browser = await getBrowser()
  const page = await browser.newPage()
  // Set a realistic viewport and user agent
  await page.setViewportSize({ width: 1280, height: 800 })
  return page
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close()
    browserInstance = null
  }
}

/**
 * Navigate to a URL with retry logic and configurable delay.
 */
export async function navigateWithRetry(
  page: Page,
  url: string,
  opts: { retries?: number; delayMs?: number; waitSelector?: string } = {}
): Promise<void> {
  const { retries = 3, delayMs = 2000, waitSelector } = opts

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 })
      if (waitSelector) {
        await page.waitForSelector(waitSelector, { timeout: 10000 })
      }
      return
    } catch (err) {
      if (attempt === retries) throw err
      console.warn(`Navigation attempt ${attempt}/${retries} failed for ${url}, retrying...`)
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }
}
