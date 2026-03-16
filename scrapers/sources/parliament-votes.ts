// Scraper: Parliament of Nepal — Voting Records
// Source: https://parliament.gov.np
// Target pages:
//   - Session/voting records: https://parliament.gov.np/np/post/voting-records
//   - Individual vote detail pages
// Engine: Playwright (JS-rendered dynamic content)

import { prisma } from "@/lib/prisma"
import { getPage, navigateWithRetry } from "../utils/browser"
import { withScrapeLogging } from "../utils/logger"
import { cleanText, parseDate } from "../utils/normalize"
import { ScrapedVoteSchema, type ScrapedVote } from "@/types/scraper"
import { SOURCES } from "@/config/scraping"
import { sleep } from "../utils/http"

const config = SOURCES["parliament-votes"]

export async function scrapeParliamentVotes() {
  return withScrapeLogging("parliament-votes", config.baseUrl, async () => {
    const page = await getPage()
    const records: ScrapedVote[] = []
    let created = 0
    let updated = 0
    let rawHtml = ""

    try {
      // Navigate to voting records page
      await navigateWithRetry(page, `${config.baseUrl}/np/post/voting-records`, {
        retries: config.maxRetries,
        delayMs: config.requestDelayMs,
        waitSelector: "table, .post-list, .content-area",
      })

      rawHtml = await page.content()

      // Extract vote session rows
      // Parliament site typically lists votes in a table:
      // SN | Session/Bill | Date | Result
      const rows = await page.$$eval(
        "table.table tbody tr, .post-list .post-item",
        (els) =>
          els.map((el) => {
            const cells = el.querySelectorAll("td")
            const link = el.querySelector("a")
            return {
              description: cells[1]?.textContent?.trim() ?? link?.textContent?.trim() ?? "",
              date: cells[2]?.textContent?.trim() ?? "",
              result: cells[3]?.textContent?.trim() ?? "",
              href: link?.getAttribute("href") ?? "",
            }
          })
      )

      for (const row of rows) {
        if (!row.description) continue

        await sleep(config.requestDelayMs)

        const outcome =
          row.result.toLowerCase().includes("pass") || row.result.toLowerCase().includes("adopted")
            ? "PASSED"
            : "DEFEATED"

        const vote: ScrapedVote = {
          date: parseDate(row.date) ?? new Date(),
          type: row.description.toLowerCase().includes("amendment") ? "AMENDMENT" : "FINAL_PASSAGE",
          outcome: outcome as "PASSED" | "DEFEATED",
          description: cleanText(row.description),
          externalId: row.href ? row.href.split("/").pop() : undefined,
          sourceUrl: row.href
            ? row.href.startsWith("http")
              ? row.href
              : `${config.baseUrl}${row.href}`
            : undefined,
        }

        const parsed = ScrapedVoteSchema.safeParse(vote)
        if (!parsed.success) {
          console.warn(`Invalid vote data: ${parsed.error.message}`)
          continue
        }

        records.push(parsed.data)

        // Scrape individual vote detail for MP-level breakdown
        if (vote.sourceUrl) {
          try {
            await navigateWithRetry(page, vote.sourceUrl, {
              retries: 2,
              delayMs: config.requestDelayMs,
            })

            // Attempt to extract per-MP vote data from detail page
            // parliament.gov.np typically shows vote lists per constituency
            const memberVoteRows = await page.$$eval(
              "table.vote-detail tbody tr, .member-vote-list .item",
              (els) =>
                els.map((el) => {
                  const cells = el.querySelectorAll("td, span")
                  return {
                    memberExternalId: cells[0]?.textContent?.trim() ?? "",
                    choice: cells[1]?.textContent?.trim() ?? "",
                  }
                })
            ).catch(() => [])

            if (memberVoteRows.length > 0) {
              vote.memberVotes = memberVoteRows
                .filter((mv) => mv.memberExternalId)
                .map((mv) => ({
                  memberExternalId: mv.memberExternalId,
                  choice: normalizeVoteChoice(mv.choice),
                }))
            }
          } catch {
            // Detail page failed — continue with listing data
          }
        }

        // Upsert into database
        const existing = vote.externalId
          ? await prisma.vote.findFirst({ where: { externalId: vote.externalId } })
          : null

        if (existing) {
          await prisma.vote.update({
            where: { id: existing.id },
            data: {
              description: vote.description,
              outcome: vote.outcome,
              sourceUrl: vote.sourceUrl,
              confidence: "SCRAPED",
            },
          })
          updated++
        } else {
          const newVote = await prisma.vote.create({
            data: {
              date: vote.date,
              type: vote.type,
              outcome: vote.outcome,
              description: vote.description,
              externalId: vote.externalId,
              sourceUrl: vote.sourceUrl,
              confidence: "SCRAPED",
            },
          })

          // Insert member votes if available
          if (vote.memberVotes && vote.memberVotes.length > 0) {
            for (const mv of vote.memberVotes) {
              const member = await prisma.member.findFirst({
                where: { externalId: mv.memberExternalId },
              })
              if (member) {
                await prisma.memberVote.create({
                  data: {
                    memberId: member.id,
                    voteId: newVote.id,
                    choice: mv.choice,
                  },
                }).catch(() => {
                  // Skip duplicate member votes
                })
              }
            }
          }

          // Add to activity feed
          await prisma.activityFeed.create({
            data: {
              type: "VOTE",
              title: `Vote: ${vote.description}`,
              summary: `Outcome: ${vote.outcome}`,
              date: vote.date,
              entityId: newVote.id,
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

function normalizeVoteChoice(raw: string): "YEA" | "NAY" | "ABSTAIN" | "ABSENT" {
  const lower = raw.toLowerCase().trim()
  if (lower.includes("yea") || lower.includes("yes") || lower.includes("पक्ष")) return "YEA"
  if (lower.includes("nay") || lower.includes("no") || lower.includes("विपक्ष")) return "NAY"
  if (lower.includes("abstain") || lower.includes("तटस्थ")) return "ABSTAIN"
  return "ABSENT"
}
