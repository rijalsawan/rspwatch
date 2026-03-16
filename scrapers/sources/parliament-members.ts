// Scraper: Parliament of Nepal — MP List & Profiles
// Source: https://parliament.gov.np
// Target pages:
//   - Member listing: https://parliament.gov.np/np/members/parliament
//   - Individual member profile pages
// Engine: Playwright (JS-rendered dynamic content)

import { prisma } from "@/lib/prisma"
import { getPage, navigateWithRetry } from "../utils/browser"
import { withScrapeLogging } from "../utils/logger"
import { slugify, cleanText, parsePercentage } from "../utils/normalize"
import { ScrapedMemberSchema, type ScrapedMember } from "@/types/scraper"
import { SOURCES } from "@/config/scraping"
import { sleep } from "../utils/http"

const config = SOURCES["parliament-members"]

export async function scrapeParliamentMembers() {
  return withScrapeLogging("parliament-members", config.baseUrl, async () => {
    const page = await getPage()
    const records: ScrapedMember[] = []
    let created = 0
    let updated = 0
    let rawHtml = ""

    try {
      // Navigate to the MP listing page
      await navigateWithRetry(page, `${config.baseUrl}/np/members/parliament`, {
        retries: config.maxRetries,
        delayMs: config.requestDelayMs,
        waitSelector: "table, .member-list, .content-area",
      })

      rawHtml = await page.content()

      // Extract MP rows from listing
      // parliament.gov.np member list typically has:
      // Photo | Name | Constituency | Province | Party
      const rows = await page.$$eval(
        "table.table tbody tr, .member-list .member-item, .member-card",
        (els) =>
          els.map((el) => {
            const cells = el.querySelectorAll("td, .member-name, .member-info")
            const link = el.querySelector("a")
            const img = el.querySelector("img")
            return {
              name: cells[1]?.textContent?.trim() ?? link?.textContent?.trim() ?? "",
              constituency: cells[2]?.textContent?.trim() ?? "",
              province: cells[3]?.textContent?.trim() ?? "",
              party: cells[4]?.textContent?.trim() ?? "",
              photoUrl: img?.getAttribute("src") ?? "",
              href: link?.getAttribute("href") ?? "",
            }
          })
      )

      // Filter to RSP members only
      const rspMembers = rows.filter(
        (r) =>
          r.party.includes("राष्ट्रिय स्वतन्त्र पार्टी") ||
          r.party.toLowerCase().includes("rastriya swatantra") ||
          r.party.toLowerCase().includes("rsp")
      )

      for (const row of rspMembers) {
        if (!row.name) continue

        await sleep(config.requestDelayMs)

        const member: ScrapedMember = {
          name: cleanText(row.name),
          role: "Member of Parliament",
          constituency: cleanText(row.constituency),
          province: cleanText(row.province),
          photoUrl: row.photoUrl
            ? row.photoUrl.startsWith("http")
              ? row.photoUrl
              : `${config.baseUrl}${row.photoUrl}`
            : undefined,
          externalId: row.href ? row.href.split("/").pop() : undefined,
          sourceUrl: row.href
            ? row.href.startsWith("http")
              ? row.href
              : `${config.baseUrl}${row.href}`
            : undefined,
        }

        // Optionally scrape individual profile for role/attendance
        if (member.sourceUrl) {
          try {
            await navigateWithRetry(page, member.sourceUrl, {
              retries: 2,
              delayMs: config.requestDelayMs,
            })

            const roleText = await page.$eval(
              ".member-position, .designation, .role",
              (el) => el.textContent?.trim() ?? ""
            ).catch(() => "")

            if (roleText) {
              member.role = cleanText(roleText)
            }

            // Try to get Nepali name
            const nepaliName = await page.$eval(
              ".member-name-np, .name-nepali",
              (el) => el.textContent?.trim() ?? ""
            ).catch(() => "")

            if (nepaliName) {
              member.nameNepali = nepaliName
            }
          } catch {
            // Profile page failed — continue with listing data
          }
        }

        const parsed = ScrapedMemberSchema.safeParse(member)
        if (!parsed.success) {
          console.warn(`Invalid member data: ${parsed.error.message}`)
          continue
        }

        records.push(parsed.data)

        // Upsert into database
        const slug = slugify(member.name)
        const existing = member.externalId
          ? await prisma.member.findFirst({ where: { externalId: member.externalId } })
          : await prisma.member.findUnique({ where: { slug } })

        if (existing) {
          await prisma.member.update({
            where: { id: existing.id },
            data: {
              name: member.name,
              nameNepali: member.nameNepali,
              constituency: member.constituency,
              province: member.province,
              role: member.role,
              photoUrl: member.photoUrl,
              sourceUrl: member.sourceUrl,
            },
          })
          updated++
        } else {
          await prisma.member.create({
            data: {
              slug,
              name: member.name,
              nameNepali: member.nameNepali,
              constituency: member.constituency,
              province: member.province,
              role: member.role ?? "Member of Parliament",
              photoUrl: member.photoUrl,
              externalId: member.externalId,
              sourceUrl: member.sourceUrl,
              isActive: true,
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
