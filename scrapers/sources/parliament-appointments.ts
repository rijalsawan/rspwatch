/**
 * Parliament Appointments Scraper
 *
 * Scrapes current cabinet/government appointments from official Nepali government
 * sources (pmo.gov.np, nepal.gov.np) to keep appointment and member role data
 * up-to-date.
 *
 * Critical behaviour:
 *  - When a new Prime Minister appointment is upserted, the matched Member's
 *    role is set to "Prime Minister" and any previously-stored PM is reset.
 *  - Minister appointments update the matched Member's role to the position string.
 *  - Members are matched by name normalisation (lowercased, diacritics stripped).
 */

import * as cheerio from "cheerio"
import { prisma } from "@/lib/prisma"
import { withScrapeLogging } from "../utils/logger"
import { cleanText } from "../utils/normalize"
import { fetchRawHtml } from "../utils/http"

const JOB_NAME = "parliament-appointments"

// Sources tried in priority order — first successful parse wins.
const CABINET_SOURCES = [
  { url: "https://pmo.gov.np/en/ministers/", label: "PMO Cabinet Ministers" },
  { url: "https://pmo.gov.np/ministers/", label: "PMO Cabinet (Nepali)" },
  { url: "https://nepal.gov.np/en/content/council-of-ministers", label: "Nepal.gov.np Cabinet" },
  { url: "https://pmo.gov.np/en/", label: "PMO Homepage" },
  { url: "https://pmo.gov.np/", label: "PMO Homepage (Nepali)" },
]

interface ParsedAppointment {
  appointee: string
  position: string
  description: string
  sourceUrl: string
}

/**
 * Normalise a name for fuzzy matching: lowercase, remove titles and extra spaces.
 */
function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/श्री|dr\.|mr\.|mrs\.|hon\.?\s*/gi, "")
    .replace(/,.*$/, "") // remove suffixes after comma
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Return true if position string indicates a Prime Minister or Deputy PM role.
 */
function isPMPosition(position: string): boolean {
  const p = position.toLowerCase()
  return p.includes("prime minister") || p.includes("pradhanmantri") || p.includes("प्रधानमन्त्री")
}

/**
 * Infer a canonical position title from a raw string.
 */
function canonicalPosition(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes("prime minister") || lower.includes("प्रधानमन्त्री"))
    return "Prime Minister"
  if (lower.includes("deputy prime minister") || lower.includes("उपप्रधानमन्त्री"))
    return "Deputy Prime Minister"
  if (lower.includes("minister"))
    return raw.trim()
  return raw.trim()
}

/**
 * Try to extract appointments from a Cheerio document loaded from a cabinet page.
 * Tries multiple common HTML patterns used on Nepal government sites.
 */
function extractAppointmentsFromHtml(
  $: ReturnType<typeof cheerio.load>,
  sourceUrl: string
): ParsedAppointment[] {
  const results: ParsedAppointment[] = []

  // Pattern 1: table rows — common on parliament/government listing pages
  $("table tbody tr, table tr").each((_, row) => {
    const cells = $(row).find("td")
    if (cells.length < 2) return

    const nameCell = cleanText($(cells[0]).text())
    const posCell = cleanText($(cells[1]).text())

    if (!nameCell || !posCell) return
    if (nameCell.toLowerCase() === "name" || nameCell.toLowerCase() === "s.n.") return // header row
    if (nameCell.includes("नाम") || posCell.includes("पद")) return // Nepali header rows

    const position = canonicalPosition(posCell)
    if (!position) return

    results.push({
      appointee: nameCell,
      position,
      description: `${nameCell} appointed as ${position}.`,
      sourceUrl,
    })
  })

  if (results.length > 0) return results

  // Pattern 2: card/list items — `.minister-card`, `.minister-item`, `.team-member`, `.cabinet-member`
  const cardSelectors = [
    ".minister-card",
    ".minister-item",
    ".cabinet-member",
    ".team-member",
    ".member-card",
    ".card-minister",
    "article.minister",
  ]

  for (const selector of cardSelectors) {
    $(selector).each((_, card) => {
      const name = cleanText($(card).find("h2, h3, h4, .name, .minister-name").first().text())
      const pos = cleanText($(card).find("p, .designation, .post, .ministry, .position").first().text())
      if (name && pos) {
        results.push({
          appointee: name,
          position: canonicalPosition(pos),
          description: `${name} appointed as ${canonicalPosition(pos)}.`,
          sourceUrl,
        })
      }
    })
    if (results.length > 0) return results
  }

  // Pattern 3: heading + paragraph pairs — general fallback for unstructured pages
  $("h1, h2, h3, h4").each((_, heading) => {
    const headingText = cleanText($(heading).text())
    const headingLower = headingText.toLowerCase()

    // Look for PM/Minister mentions in headings
    if (
      headingLower.includes("prime minister") ||
      headingLower.includes("प्रधानमन्त्री") ||
      headingLower.includes("minister") ||
      headingLower.includes("मन्त्री")
    ) {
      const sibling = $(heading).next("p, div")
      const siblingText = cleanText(sibling.text())

      if (siblingText && siblingText.length < 200) {
        const position = canonicalPosition(headingText)
        results.push({
          appointee: siblingText,
          position,
          description: `${siblingText} — ${position}`,
          sourceUrl,
        })
      }
    }
  })

  return results
}

/**
 * Find a matching Member record by normalised name comparison.
 * Returns the first match if found, null otherwise.
 */
async function findMemberByName(appointeeName: string): Promise<{ id: string; name: string; role: string } | null> {
  const normTarget = normaliseName(appointeeName)
  if (!normTarget) return null

  // Fetch all active members and compare normalised names
  const members = await prisma.member.findMany({
    where: { isActive: true },
    select: { id: true, name: true, role: true },
  })

  // Exact normalised match first
  for (const m of members) {
    if (normaliseName(m.name) === normTarget) return m
  }

  // Partial match: target contains member's last name (handles "Balendra Shah" vs "Balendra Singh Shah" etc.)
  const targetParts = normTarget.split(" ")
  const lastName = targetParts[targetParts.length - 1]
  if (lastName && lastName.length > 3) {
    for (const m of members) {
      const memberNorm = normaliseName(m.name)
      if (memberNorm.endsWith(lastName) || memberNorm.includes(normTarget)) return m
    }
  }

  return null
}

/**
 * Upsert a single appointment and optionally update member role.
 * Returns { created, updated }.
 */
async function upsertAppointment(
  parsed: ParsedAppointment,
  appointmentDate: Date
): Promise<{ created: number; updated: number }> {
  // Derive a stable external ID from appointee + position
  const externalKey = `parliament-appointment-${normaliseName(parsed.appointee)}-${normaliseName(parsed.position)}`

  const matchedMember = await findMemberByName(parsed.appointee)
  const memberId = matchedMember?.id ?? null

  const existingAppt = await prisma.appointment.findFirst({
    where: {
      appointee: { contains: normaliseName(parsed.appointee).split(" ").pop() ?? parsed.appointee, mode: "insensitive" },
      position: { equals: parsed.position, mode: "insensitive" },
    },
    select: { id: true },
  })

  let created = 0
  let updated = 0

  if (existingAppt) {
    await prisma.appointment.update({
      where: { id: existingAppt.id },
      data: {
        appointee: parsed.appointee,
        position: parsed.position,
        description: parsed.description,
        sourceUrl: parsed.sourceUrl,
        date: appointmentDate,
        confidence: "SCRAPED",
        ...(memberId ? { memberId } : {}),
      },
    })
    updated = 1
  } else {
    await prisma.appointment.create({
      data: {
        title: `Appointment — ${parsed.position}`,
        appointee: parsed.appointee,
        position: parsed.position,
        date: appointmentDate,
        description: parsed.description,
        sourceUrl: parsed.sourceUrl,
        confidence: "SCRAPED",
        ...(memberId ? { memberId } : {}),
      },
    })
    created = 1
  }

  // ── Role sync: update Member.role to match appointment position ───────────
  if (matchedMember) {
    const newRole = isPMPosition(parsed.position) ? "Prime Minister" : parsed.position

    if (matchedMember.role !== newRole) {
      await prisma.member.update({
        where: { id: matchedMember.id },
        data: { role: newRole },
      })
    }

    // If this is a new PM, reset all OTHER members who previously held PM role
    if (isPMPosition(parsed.position)) {
      await prisma.member.updateMany({
        where: {
          role: "Prime Minister",
          id: { not: matchedMember.id },
        },
        data: { role: "Member of Parliament" },
      })
    }
  }

  return { created, updated }
}

/**
 * Main scraper entry point.
 */
export async function scrapeParliamentAppointments() {
  return withScrapeLogging(JOB_NAME, CABINET_SOURCES[0].url, async () => {
    const allParsed: ParsedAppointment[] = []
    let primarySourceUrl = CABINET_SOURCES[0].url

    // Try each source until we get a non-empty result
    for (const source of CABINET_SOURCES) {
      try {
        const html = await fetchRawHtml(source.url, { retries: 2, delayMs: 2000 })
        const $ = cheerio.load(html)
        const parsed = extractAppointmentsFromHtml($, source.url)

        if (parsed.length > 0) {
          allParsed.push(...parsed)
          primarySourceUrl = source.url
          console.log(`[parliament-appointments] Parsed ${parsed.length} appointments from ${source.label}`)
          break
        } else {
          console.warn(`[parliament-appointments] No appointments found at ${source.label}, trying next source`)
        }
      } catch (err) {
        console.warn(`[parliament-appointments] Failed to fetch ${source.url}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    if (allParsed.length === 0) {
      console.warn("[parliament-appointments] All sources exhausted — no appointment data found. Attempting fallback from news scraper data.")
      // Fallback: check if any recent news-sourced appointments exist in ActivityFeed
      // and look for appointment items tagged as "APPOINTMENT" type
      const recentFeedAppointments = await prisma.activityFeed.findMany({
        where: {
          type: "APPOINTMENT",
          date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // last 90 days
        },
        include: { relatedMember: { select: { id: true, name: true, role: true } } },
        orderBy: { date: "desc" },
        take: 10,
      })

      // Convert feed items into parsed appointments where we have member info
      for (const feed of recentFeedAppointments) {
        if (!feed.relatedMember) continue
        const posMatch = feed.title.match(/appointed?\s+(?:as\s+)?(.+)/i)
        if (!posMatch) continue
        const position = canonicalPosition(posMatch[1].trim().slice(0, 100))
        if (!position) continue
        allParsed.push({
          appointee: feed.relatedMember.name,
          position,
          description: feed.summary ?? feed.title,
          sourceUrl: feed.sourceUrl ?? primarySourceUrl,
        })
      }
    }

    const appointmentDate = new Date()
    let totalCreated = 0
    let totalUpdated = 0

    for (const parsed of allParsed) {
      try {
        const { created, updated } = await upsertAppointment(parsed, appointmentDate)
        totalCreated += created
        totalUpdated += updated
      } catch (err) {
        console.error(`[parliament-appointments] Failed to upsert ${parsed.appointee} / ${parsed.position}:`, err)
      }
    }

    return {
      records: allParsed,
      created: totalCreated,
      updated: totalUpdated,
      rawHtml: undefined,
    }
  })
}
