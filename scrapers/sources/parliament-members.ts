// Scraper: Parliament of Nepal — All MPs & Party Data
// Source: https://parliament.gov.np
// Target pages:
//   - Member listing: https://parliament.gov.np/np/members/parliament
//   - Individual member profile pages
// Engine: Playwright (JS-rendered dynamic content)

import { prisma } from "@/lib/prisma"
import { getPage, navigateWithRetry } from "../utils/browser"
import { withScrapeLogging } from "../utils/logger"
import { slugify, cleanText } from "../utils/normalize"
import { ScrapedMemberSchema, type ScrapedMember } from "@/types/scraper"
import { SOURCES } from "@/config/scraping"
import { sleep } from "../utils/http"

const config = SOURCES["parliament-members"]

// ─── Party name normalisation ────────────────────────────────────
// Maps common Nepali party names (Devanagari + romanised) to canonical
// English form used for the slug and abbreviation.
const PARTY_MAP: Array<{
  patterns: string[]
  name: string
  nameNepali: string
  abbreviation: string
  color: string
}> = [
  {
    patterns: ["राष्ट्रिय स्वतन्त्र", "rastriya swatantra", "rsp"],
    name: "Rastriya Swatantra Party",
    nameNepali: "राष्ट्रिय स्वतन्त्र पार्टी",
    abbreviation: "RSP",
    color: "#0ea5e9",
  },
  {
    patterns: ["नेपाली काँग्रेस", "nepali congress", "nc"],
    name: "Nepali Congress",
    nameNepali: "नेपाली काँग्रेस",
    abbreviation: "NC",
    color: "#3b82f6",
  },
  {
    patterns: ["एमाले", "cpn-uml", "cpn uml", "uml"],
    name: "CPN-UML",
    nameNepali: "नेकपा एमाले",
    abbreviation: "UML",
    color: "#ef4444",
  },
  {
    patterns: ["माओवादी", "maoist", "cpn maoist"],
    name: "CPN (Maoist Centre)",
    nameNepali: "नेकपा (माओवादी केन्द्र)",
    abbreviation: "MC",
    color: "#dc2626",
  },
  {
    patterns: ["राष्ट्रिय प्रजातन्त्र", "rastriya prajatantra", "rpp"],
    name: "Rastriya Prajatantra Party",
    nameNepali: "राष्ट्रिय प्रजातन्त्र पार्टी",
    abbreviation: "RPP",
    color: "#f97316",
  },
  {
    patterns: ["एकीकृत समाजवादी", "unified socialist"],
    name: "CPN (Unified Socialist)",
    nameNepali: "नेकपा (एकीकृत समाजवादी)",
    abbreviation: "CPNUS",
    color: "#8b5cf6",
  },
  {
    patterns: ["लोकतान्त्रिक समाजवादी", "loktantrik samajwadi", "lsp"],
    name: "Loktantrik Samajwadi Party",
    nameNepali: "लोकतान्त्रिक समाजवादी पार्टी",
    abbreviation: "LSP",
    color: "#10b981",
  },
  {
    patterns: ["जनमत", "janmat"],
    name: "Janmat Party",
    nameNepali: "जनमत पार्टी",
    abbreviation: "JANMAT",
    color: "#f59e0b",
  },
]

/** Resolve a raw party string scraped from parliament.gov.np to a Party record. Creates the party if it doesn't exist. */
async function getOrCreateParty(rawParty: string): Promise<string | null> {
  if (!rawParty) return null

  const lower = rawParty.toLowerCase()
  const match = PARTY_MAP.find((p) =>
    p.patterns.some((pat) => lower.includes(pat.toLowerCase()) || rawParty.includes(pat))
  )

  const canonical = match ?? {
    name: cleanText(rawParty),
    nameNepali: rawParty,
    abbreviation: rawParty.toUpperCase().substring(0, 8),
    color: "#6b7280",
  }

  const slug = slugify(canonical.abbreviation || canonical.name)
  if (!slug) return null

  const party = await prisma.party.upsert({
    where: { slug },
    update: { name: canonical.name, nameNepali: canonical.nameNepali },
    create: {
      slug,
      name: canonical.name,
      nameNepali: canonical.nameNepali,
      abbreviation: canonical.abbreviation,
      color: canonical.color,
    },
  })

  return party.id
}

// ─── Main scraper ─────────────────────────────────────────────

export async function scrapeParliamentMembers() {
  return withScrapeLogging("parliament-members", config.baseUrl, async () => {
    const page = await getPage()
    const records: ScrapedMember[] = []
    let created = 0
    let updated = 0
    let rawHtml = ""

    try {
      // Navigate to the full MP listing page
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

      for (const row of rows) {
        if (!row.name) continue

        await sleep(config.requestDelayMs)

        // Resolve party → get/create Party record
        const partyId = await getOrCreateParty(row.party)

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

            if (roleText) member.role = cleanText(roleText)

            const nepaliName = await page.$eval(
              ".member-name-np, .name-nepali",
              (el) => el.textContent?.trim() ?? ""
            ).catch(() => "")

            if (nepaliName) member.nameNepali = nepaliName
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
              ...(partyId ? { partyId } : {}),
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
              ...(partyId ? { partyId } : {}),
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
