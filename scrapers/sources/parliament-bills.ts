// Scraper: Parliament of Nepal — Bills & Laws
// Source: https://parliament.gov.np
// Target pages:
//   - Bill listing: https://parliament.gov.np/np/post/bills (Nepali listing page)
//   - Individual bill pages linked from listing
// Engine: Playwright (JS-rendered dynamic content)

import { prisma } from "@/lib/prisma"
import { getPage, navigateWithRetry } from "../utils/browser"
import { withScrapeLogging } from "../utils/logger"
import { slugify, cleanText, normalizeLawStatus, parseDate } from "../utils/normalize"
import { ScrapedBillSchema, type ScrapedBill } from "@/types/scraper"
import { SOURCES } from "@/config/scraping"
import { sleep } from "../utils/http"

const config = SOURCES["parliament-bills"]

export async function scrapeParliamentBills() {
  return withScrapeLogging("parliament-bills", config.baseUrl, async () => {
    const page = await getPage()
    const records: ScrapedBill[] = []
    let created = 0
    let updated = 0
    let rawHtml = ""

    try {
      // Navigate to the bills listing page
      // Selector: the bill table or list container on parliament.gov.np
      await navigateWithRetry(page, `${config.baseUrl}/np/post/bills`, {
        retries: config.maxRetries,
        delayMs: config.requestDelayMs,
        waitSelector: "table, .post-list, .content-area", // parliament.gov.np uses various layouts
      })

      rawHtml = await page.content()

      // Extract bill rows from the listing table
      // parliament.gov.np typically renders bills in a <table> with columns:
      // SN | Bill Title | Presented Date | Status
      const rows = await page.$$eval(
        // Selector targets the main content table rows (skip header)
        "table.table tbody tr, .post-list .post-item",
        (els) =>
          els.map((el) => {
            const cells = el.querySelectorAll("td, .post-title, .post-meta")
            const link = el.querySelector("a")
            return {
              title: cells[1]?.textContent?.trim() ?? link?.textContent?.trim() ?? "",
              date: cells[2]?.textContent?.trim() ?? "",
              status: cells[3]?.textContent?.trim() ?? "",
              href: link?.getAttribute("href") ?? "",
            }
          })
      )

      for (const row of rows) {
        if (!row.title) continue

        await sleep(config.requestDelayMs)

        const bill: ScrapedBill = {
          title: cleanText(row.title),
          status: normalizeLawStatus(row.status),
          category: "General", // Will be refined from detail page
          summary: cleanText(row.title),
          proposedDate: parseDate(row.date) ?? undefined,
          sourceUrl: row.href
            ? row.href.startsWith("http")
              ? row.href
              : `${config.baseUrl}${row.href}`
            : undefined,
          externalId: row.href ? row.href.split("/").pop() : undefined,
        }

        // Validate with Zod
        const parsed = ScrapedBillSchema.safeParse(bill)
        if (!parsed.success) {
          console.warn(`Invalid bill data: ${parsed.error.message}`)
          continue
        }

        records.push(parsed.data)

        // If we have a detail page link, scrape additional info
        if (bill.sourceUrl) {
          try {
            await navigateWithRetry(page, bill.sourceUrl, {
              retries: 2,
              delayMs: config.requestDelayMs,
            })

            const detailText = await page.$eval(
              ".content-area, .post-content, article",
              (el) => el.textContent?.trim() ?? ""
            ).catch(() => "")

            if (detailText) {
              bill.summary = cleanText(detailText).substring(0, 500)
            }
          } catch {
            // Detail page failed — continue with listing data
          }
        }

        // Upsert into database
        const slug = slugify(bill.title)
        const existing = bill.externalId
          ? await prisma.law.findFirst({ where: { externalId: bill.externalId } })
          : await prisma.law.findUnique({ where: { slug } })

        if (existing) {
          await prisma.law.update({
            where: { id: existing.id },
            data: {
              title: bill.title,
              titleNepali: bill.titleNepali,
              status: bill.status,
              summary: bill.summary,
              sourceUrl: bill.sourceUrl,
              proposedDate: bill.proposedDate,
              passedDate: bill.passedDate,
              confidence: "SCRAPED",
            },
          })
          updated++
        } else {
          const newLaw = await prisma.law.create({
            data: {
              slug,
              title: bill.title,
              titleNepali: bill.titleNepali,
              code: bill.code,
              status: bill.status,
              category: bill.category,
              summary: bill.summary,
              fullText: bill.fullText,
              sourceUrl: bill.sourceUrl,
              proposedDate: bill.proposedDate,
              passedDate: bill.passedDate,
              enactedDate: bill.enactedDate,
              externalId: bill.externalId,
              confidence: "SCRAPED",
            },
          })
          // Add to activity feed
          await prisma.activityFeed.create({
            data: {
              type: "LAW",
              title: `New bill: ${bill.title}`,
              summary: bill.summary,
              date: bill.proposedDate ?? new Date(),
              entityId: newLaw.id,
              entitySlug: slug,
            },
          })
          created++
        }
      }
    } finally {
      await page.close()
    }

    return { records, created, updated, rawHtml }
  })
}
