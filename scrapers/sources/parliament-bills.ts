import { createHash } from "node:crypto"
import * as cheerio from "cheerio"
import { prisma } from "@/lib/prisma"
import { ScrapedBillSchema, type ScrapedBill } from "@/types/scraper"
import { SOURCES } from "@/config/scraping"
import { withScrapeLogging } from "../utils/logger"
import { cleanText, normalizeLawStatus, parseDate, slugify } from "../utils/normalize"
import { addScrapeContextWarning } from "../utils/run-context"
import {
  buildChamberExternalId,
  containsDevanagari,
  discoverParliamentSources,
  PARLIAMENT_CHAMBERS,
  type ParliamentChamber,
  type ParliamentSourceCandidate,
} from "./parliament-connectors"

const config = SOURCES["parliament-bills"]
const LOG_SOURCE = PARLIAMENT_CHAMBERS.map((chamber) => chamber.baseUrl).join(",")

interface ParsedBillRow {
  title: string
  titleNepali?: string
  statusRaw?: string
  dateRaw?: string
  sourceUrl?: string
  fingerprint?: string
}

const GENERIC_BILL_PATH_SEGMENTS = new Set([
  "bills",
  "bill",
  "acts",
  "act",
  "codes",
  "code",
  "posts",
  "post",
  "list",
  "index",
  "np",
  "en",
])

function toAbsoluteUrl(baseUrl: string, rawUrl: string | undefined): string | undefined {
  if (!rawUrl) return undefined
  try {
    const absolute = new URL(rawUrl, baseUrl)
    absolute.hash = ""
    if (absolute.protocol !== "http:" && absolute.protocol !== "https:") return undefined
    return absolute.toString()
  } catch {
    return undefined
  }
}

function toStableBillSourceUrl(pageUrl: string, rawUrl: string | undefined): string | undefined {
  const absolute = toAbsoluteUrl(pageUrl, rawUrl)
  if (!absolute) return undefined

  try {
    const resolved = new URL(absolute)
    const page = new URL(pageUrl)

    if (
      resolved.origin === page.origin &&
      resolved.pathname === page.pathname &&
      resolved.search === page.search
    ) {
      return undefined
    }

    const lastSegment =
      resolved.pathname
        .split("/")
        .filter(Boolean)
        .at(-1)
        ?.toLowerCase() ?? ""
    const queryKeys = Array.from(resolved.searchParams.keys()).map((value) => value.toLowerCase())
    const hasIdentityQuery =
      queryKeys.some((key) => key === "id" || key.endsWith("id")) ||
      queryKeys.some((key) => ["slug", "bill", "act", "code", "post"].includes(key))

    if (GENERIC_BILL_PATH_SEGMENTS.has(lastSegment) && !hasIdentityQuery) {
      return undefined
    }

    return resolved.toString()
  } catch {
    return undefined
  }
}

function looksLikeBillTitle(text: string): boolean {
  if (text.length < 5) return false
  if (!/[A-Za-z\u0900-\u097F]/.test(text)) return false
  const lower = text.toLowerCase()
  if (lower.includes("download") || lower.includes("view")) return false
  return true
}

function pickByKeywords(textValues: string[], keywords: string[]): string | undefined {
  return textValues.find((value) => {
    const lower = value.toLowerCase()
    return keywords.some((keyword) => lower.includes(keyword.toLowerCase()))
  })
}

function parseBillRowsFromHtml(
  html: string,
  chamber: ParliamentChamber,
  sourceUrl: string
): ParsedBillRow[] {
  const $ = cheerio.load(html)
  const rows: ParsedBillRow[] = []
  const seen = new Set<string>()

  const addRow = (row: ParsedBillRow) => {
    const signature = `${row.title.toLowerCase()}|${row.sourceUrl ?? ""}|${row.fingerprint ?? ""}`
    if (seen.has(signature)) return
    seen.add(signature)
    rows.push(row)
  }

  $("table tbody tr, .post-item, .news-item, .list-group-item, article").each((_, element) => {
    const $element = $(element)

    const textValues = $element
      .find("td, th, p, span, .title, .post-title, .summary")
      .map((__, node) => cleanText($(node).text()))
      .get()
      .filter((value) => value.length > 1)

    const anchor = $element.find("a[href]").first()
    const anchorText = cleanText(anchor.text())

    const title = looksLikeBillTitle(anchorText)
      ? anchorText
      : textValues.find((value) => looksLikeBillTitle(value))
    if (!title) return

    const statusRaw = pickByKeywords(textValues, [
      "status",
      "passed",
      "approved",
      "draft",
      "committee",
      "enacted",
      "rejected",
      "विधेयक",
      "ऐन",
      "पारित",
      "मस्यौदा",
      "समीति",
    ])

    const dateRaw = textValues.find((value) => parseDate(value) !== null)
    const billSourceUrl = toStableBillSourceUrl(sourceUrl, anchor.attr("href"))
    const fingerprint = cleanText($element.text()) || `${title}|${billSourceUrl ?? ""}`

    addRow({
      title,
      titleNepali: containsDevanagari(title) ? title : undefined,
      statusRaw,
      dateRaw,
      sourceUrl: billSourceUrl,
      fingerprint,
    })
  })

  if (rows.length === 0) {
    $("a[href]").each((_, element) => {
      const $element = $(element)
      const text = cleanText($element.text())
      const href = $element.attr("href")
      const billSourceUrl = toStableBillSourceUrl(sourceUrl, href)

      if (!looksLikeBillTitle(text)) return
      if (!billSourceUrl) return

      const path = new URL(billSourceUrl).pathname.toLowerCase()
      if (
        !path.includes("bill") &&
        !path.includes("act") &&
        !path.includes("code") &&
        !path.includes("post")
      ) {
        return
      }

      addRow({
        title: text,
        titleNepali: containsDevanagari(text) ? text : undefined,
        sourceUrl: billSourceUrl,
        fingerprint: `${text}|${billSourceUrl}`,
      })
    })
  }

  return rows
}

function pickBestCandidate(
  chamber: ParliamentChamber,
  candidates: ParliamentSourceCandidate[]
): ParliamentSourceCandidate | null {
  if (candidates.length === 0) {
    addScrapeContextWarning(`[parliament-bills] No source discovered for ${chamber.name}`)
    return null
  }

  for (const candidate of candidates) {
    const rows = parseBillRowsFromHtml(candidate.html, chamber, candidate.url)
    if (rows.length > 0) return candidate
  }

  addScrapeContextWarning(
    `[parliament-bills] Sources discovered but extraction yielded zero rows for ${chamber.name}`
  )
  return null
}

function buildSafeSlug(title: string, externalId: string): string {
  const normalized = slugify(title)
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  const normalizedExternalId = externalId
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  const suffix =
    normalizedExternalId.slice(-12) ||
    createHash("sha256").update(externalId).digest("hex").slice(0, 12)

  const base = normalized || "law"
  const maxBaseLength = Math.max(1, 100 - (suffix.length + 1))
  const trimmedBase = base.slice(0, maxBaseLength)

  return `${trimmedBase}-${suffix}`
}

export async function scrapeParliamentBills() {
  return withScrapeLogging("parliament-bills", LOG_SOURCE, async () => {
    const records: ScrapedBill[] = []
    const seenExternalIds = new Set<string>()
    let created = 0
    let updated = 0
    let invalidRows = 0
    let invalidWarnings = 0
    let ambiguousRows = 0
    const rawHtmlParts: string[] = []

    const sourceMap = await discoverParliamentSources("bills", {
      maxRetries: config.maxRetries,
      delayMs: config.requestDelayMs,
    })

    for (const chamber of PARLIAMENT_CHAMBERS) {
      const candidate = pickBestCandidate(chamber, sourceMap[chamber.key])
      if (!candidate) continue

      rawHtmlParts.push(`<!-- ${chamber.key}:${candidate.url} -->\n${candidate.html.slice(0, 20000)}`)
      const parsedRows = parseBillRowsFromHtml(candidate.html, chamber, candidate.url)

      for (const row of parsedRows) {
        const normalizedTitle = cleanText(row.title)
        const sourceUrl = row.sourceUrl
        if (!sourceUrl && !row.fingerprint) {
          ambiguousRows++
          addScrapeContextWarning(
            `[parliament-bills] Skipped ambiguous bill row without stable identity for ${chamber.name}: ${normalizedTitle}`
          )
          continue
        }

        const status = normalizeLawStatus(row.statusRaw || normalizedTitle)
        const proposedDate = row.dateRaw ? parseDate(row.dateRaw) ?? undefined : undefined
        const fallbackIdentity = [
          normalizedTitle,
          row.titleNepali ? cleanText(row.titleNepali) : "",
          status,
          proposedDate ? proposedDate.toISOString().slice(0, 10) : "",
          candidate.url,
          row.fingerprint ?? "",
        ].join("|")
        const externalId = buildChamberExternalId(
          chamber.key,
          "bill",
          sourceUrl,
          fallbackIdentity
        )

        if (seenExternalIds.has(externalId)) {
          ambiguousRows++
          addScrapeContextWarning(
            `[parliament-bills] Skipped duplicate externalId in run for ${chamber.name}: ${externalId}`
          )
          continue
        }
        seenExternalIds.add(externalId)

        const billPayload: ScrapedBill = {
          title: normalizedTitle,
          titleNepali: row.titleNepali ? cleanText(row.titleNepali) : undefined,
          code: undefined,
          status,
          category: chamber.name,
          summary: normalizedTitle,
          fullText: undefined,
          proposedDate,
          passedDate: undefined,
          enactedDate: undefined,
          sponsorName: undefined,
          externalId,
          sourceUrl,
        }

        const parsed = ScrapedBillSchema.safeParse(billPayload)
        if (!parsed.success) {
          invalidRows++
          if (invalidWarnings < 5) {
            const firstIssue = parsed.error.issues[0]
            addScrapeContextWarning(
              `[parliament-bills] Dropped invalid row for ${chamber.name}: ${firstIssue?.path.join(".") ?? "unknown"} ${firstIssue?.message ?? "schema validation failed"}`
            )
            invalidWarnings++
          }
          continue
        }

        const slug = buildSafeSlug(parsed.data.title, parsed.data.externalId ?? externalId)
        const existingByExternalId = parsed.data.externalId
          ? await prisma.law.findUnique({ where: { externalId: parsed.data.externalId } })
          : null
        const existingBySourceUrl =
          !existingByExternalId && parsed.data.sourceUrl
            ? await prisma.law.findFirst({ where: { sourceUrl: parsed.data.sourceUrl } })
            : null
        const existing = existingByExternalId ?? existingBySourceUrl

        if (existing) {
          await prisma.law.update({
            where: { id: existing.id },
            data: {
              title: parsed.data.title,
              titleNepali: parsed.data.titleNepali,
              status: parsed.data.status,
              category: parsed.data.category,
              summary: parsed.data.summary,
              sourceUrl: parsed.data.sourceUrl,
              proposedDate: parsed.data.proposedDate,
              externalId: parsed.data.externalId,
              confidence: "SCRAPED",
            },
          })
          updated++
        } else {
          const newLaw = await prisma.law.create({
            data: {
              slug,
              title: parsed.data.title,
              titleNepali: parsed.data.titleNepali,
              code: parsed.data.code,
              status: parsed.data.status,
              category: parsed.data.category,
              summary: parsed.data.summary,
              fullText: parsed.data.fullText,
              sourceUrl: parsed.data.sourceUrl,
              proposedDate: parsed.data.proposedDate,
              passedDate: parsed.data.passedDate,
              enactedDate: parsed.data.enactedDate,
              externalId: parsed.data.externalId,
              confidence: "SCRAPED",
            },
          })

          await prisma.activityFeed.create({
            data: {
              type: "LAW",
              title: `New bill: ${parsed.data.title}`,
              summary: parsed.data.summary,
              date: parsed.data.proposedDate ?? new Date(),
              entityId: newLaw.id,
              entitySlug: slug,
              sourceUrl: parsed.data.sourceUrl,
            },
          })
          created++
        }

        records.push(parsed.data)
      }
    }

    if (invalidRows > 0) {
      addScrapeContextWarning(
        `[parliament-bills] Dropped ${invalidRows} row(s) due to schema validation failures`
      )
    }

    if (ambiguousRows > 0) {
      addScrapeContextWarning(
        `[parliament-bills] Skipped ${ambiguousRows} ambiguous row(s) without stable identity`
      )
    }

    if (records.length === 0) {
      addScrapeContextWarning(
        "[parliament-bills] No bill records extracted from House or National Assembly sources"
      )
    }

    return {
      records,
      created,
      updated,
      rawHtml: rawHtmlParts.join("\n\n").slice(0, 50000),
    }
  })
}
