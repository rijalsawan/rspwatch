import * as cheerio from "cheerio"
import { prisma } from "@/lib/prisma"
import { ScrapedVoteSchema, type ScrapedVote } from "@/types/scraper"
import { SOURCES } from "@/config/scraping"
import { withScrapeLogging } from "../utils/logger"
import { cleanText, parseDate } from "../utils/normalize"
import { addScrapeContextWarning } from "../utils/run-context"
import {
  buildChamberExternalId,
  discoverParliamentSources,
  PARLIAMENT_CHAMBERS,
  type ParliamentChamber,
  type ParliamentSourceCandidate,
} from "./parliament-connectors"

const config = SOURCES["parliament-votes"]
const LOG_SOURCE = PARLIAMENT_CHAMBERS.map((chamber) => chamber.baseUrl).join(",")

interface ParsedVoteRow {
  description: string
  dateRaw?: string
  resultRaw?: string
  sourceUrl?: string
  fingerprint?: string
}

const GENERIC_VOTE_PATH_SEGMENTS = new Set([
  "votes",
  "vote",
  "verbatims",
  "today-parliament",
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

function toStableVoteSourceUrl(pageUrl: string, rawUrl: string | undefined): string | undefined {
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
      queryKeys.some((key) => ["slug", "vote", "verbatim", "record", "post"].includes(key))

    if (GENERIC_VOTE_PATH_SEGMENTS.has(lastSegment) && !hasIdentityQuery) {
      return undefined
    }

    return resolved.toString()
  } catch {
    return undefined
  }
}

function pickByKeywords(textValues: string[], keywords: string[]): string | undefined {
  return textValues.find((value) => {
    const lower = value.toLowerCase()
    return keywords.some((keyword) => lower.includes(keyword.toLowerCase()))
  })
}

function normalizeOutcome(text: string | undefined): "PASSED" | "DEFEATED" | null {
  const normalized = (text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()

  if (!normalized) {
    return null
  }

  const defeatedPatterns = [
    /\bnot\s+approved\b/u,
    /\bdid\s+not\s+pass\b/u,
    /\bdoes\s+not\s+pass\b/u,
    /\bunable\s+to\s+pass\b/u,
    /\bnot\s+passed\b/u,
    /\bnot\s+adopted\b/u,
    /\bdefeat(?:ed)?\b/u,
    /\bfailed\b/u,
    /\brejected\b/u,
    /अस्वीकृत/u,
    /असफल/u,
  ]

  if (defeatedPatterns.some((pattern) => pattern.test(normalized))) {
    return "DEFEATED"
  }

  const passedPatterns = [/\bpass(?:ed)?\b/u, /\bapproved\b/u, /\badopted\b/u, /पारित/u, /स्वीकृत/u]
  if (passedPatterns.some((pattern) => pattern.test(normalized))) {
    return "PASSED"
  }

  return null
}

function normalizeType(description: string): "FINAL_PASSAGE" | "AMENDMENT" | "PROCEDURAL" {
  const lower = description.toLowerCase()
  if (lower.includes("amendment") || lower.includes("संशोधन")) return "AMENDMENT"
  if (
    lower.includes("procedure") ||
    lower.includes("rule") ||
    lower.includes("प्रक्रिया") ||
    lower.includes("कार्यसूची")
  ) {
    return "PROCEDURAL"
  }
  return "FINAL_PASSAGE"
}

function looksLikeVoteDescription(text: string): boolean {
  if (text.length < 5) return false
  if (!/[A-Za-z\u0900-\u097F]/.test(text)) return false
  const lower = text.toLowerCase()
  if (lower.includes("download") || lower.includes("view")) return false
  return true
}

function parseVoteRowsFromHtml(
  html: string,
  _chamber: ParliamentChamber,
  sourceUrl: string
): ParsedVoteRow[] {
  const $ = cheerio.load(html)
  const rows: ParsedVoteRow[] = []
  const seen = new Set<string>()

  const addRow = (row: ParsedVoteRow) => {
    const signature = `${row.description.toLowerCase()}|${row.sourceUrl ?? ""}|${row.fingerprint ?? ""}`
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
    const description = looksLikeVoteDescription(anchorText)
      ? anchorText
      : textValues.find((value) => looksLikeVoteDescription(value))
    if (!description) return

    const dateRaw = textValues.find((value) => parseDate(value) !== null)
    const resultRaw = pickByKeywords(textValues, [
      "passed",
      "defeated",
      "approved",
      "adopted",
      "rejected",
      "पारित",
      "अस्वीकृत",
      "मतदान",
      "result",
    ])

    const voteSourceUrl = toStableVoteSourceUrl(sourceUrl, anchor.attr("href"))
    const fingerprint = cleanText($element.text()) || `${description}|${dateRaw ?? ""}|${resultRaw ?? ""}`

    addRow({
      description,
      dateRaw,
      resultRaw,
      sourceUrl: voteSourceUrl,
      fingerprint,
    })
  })

  if (rows.length === 0) {
    $("a[href]").each((_, element) => {
      const $element = $(element)
      const text = cleanText($element.text())
      const href = $element.attr("href")
      const voteSourceUrl = toStableVoteSourceUrl(sourceUrl, href)

      if (!looksLikeVoteDescription(text)) return
      if (!voteSourceUrl) return

      const path = new URL(voteSourceUrl).pathname.toLowerCase()
      if (!path.includes("vote") && !path.includes("verbatim") && !path.includes("today")) {
        return
      }

      addRow({
        description: text,
        sourceUrl: voteSourceUrl,
        fingerprint: `${text}|${voteSourceUrl}`,
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
    addScrapeContextWarning(`[parliament-votes] No source discovered for ${chamber.name}`)
    return null
  }

  for (const candidate of candidates) {
    const rows = parseVoteRowsFromHtml(candidate.html, chamber, candidate.url)
    if (rows.length > 0) return candidate
  }

  addScrapeContextWarning(
    `[parliament-votes] Sources discovered but extraction yielded zero rows for ${chamber.name}`
  )
  return null
}

export async function scrapeParliamentVotes() {
  return withScrapeLogging("parliament-votes", LOG_SOURCE, async () => {
    const records: ScrapedVote[] = []
    const seenExternalIds = new Set<string>()
    let created = 0
    let updated = 0
    let invalidRows = 0
    let invalidWarnings = 0
    let ambiguousRows = 0
    const rawHtmlParts: string[] = []

    const sourceMap = await discoverParliamentSources("votes", {
      maxRetries: config.maxRetries,
      delayMs: config.requestDelayMs,
    })

    for (const chamber of PARLIAMENT_CHAMBERS) {
      const candidate = pickBestCandidate(chamber, sourceMap[chamber.key])
      if (!candidate) continue

      rawHtmlParts.push(`<!-- ${chamber.key}:${candidate.url} -->\n${candidate.html.slice(0, 20000)}`)
      const parsedRows = parseVoteRowsFromHtml(candidate.html, chamber, candidate.url)

      for (const row of parsedRows) {
        const description = cleanText(row.description)
        const parsedDate = row.dateRaw ? parseDate(row.dateRaw) : null
        if (!parsedDate) {
          addScrapeContextWarning(
            `[parliament-votes] Skipped vote without reliable date for ${chamber.name}: ${description}`
          )
          continue
        }

        const outcome = normalizeOutcome(row.resultRaw)
        if (!outcome) {
          addScrapeContextWarning(
            `[parliament-votes] Skipped vote without explicit outcome for ${chamber.name}: ${description}`
          )
          continue
        }

        const sourceUrl = row.sourceUrl
        if (!sourceUrl && !row.fingerprint) {
          ambiguousRows++
          addScrapeContextWarning(
            `[parliament-votes] Skipped ambiguous vote row without stable identity for ${chamber.name}: ${description}`
          )
          continue
        }

        const fallbackIdentity = [
          description,
          parsedDate.toISOString().slice(0, 10),
          outcome,
          candidate.url,
          row.fingerprint ?? "",
        ].join("|")

        const externalId = buildChamberExternalId(
          chamber.key,
          "vote",
          sourceUrl,
          fallbackIdentity
        )

        if (seenExternalIds.has(externalId)) {
          ambiguousRows++
          addScrapeContextWarning(
            `[parliament-votes] Skipped duplicate externalId in run for ${chamber.name}: ${externalId}`
          )
          continue
        }
        seenExternalIds.add(externalId)

        const votePayload: ScrapedVote = {
          date: parsedDate,
          type: normalizeType(description),
          outcome,
          description,
          externalId,
          sourceUrl,
          memberVotes: undefined,
        }

        const parsed = ScrapedVoteSchema.safeParse(votePayload)
        if (!parsed.success) {
          invalidRows++
          if (invalidWarnings < 5) {
            const firstIssue = parsed.error.issues[0]
            addScrapeContextWarning(
              `[parliament-votes] Dropped invalid row for ${chamber.name}: ${firstIssue?.path.join(".") ?? "unknown"} ${firstIssue?.message ?? "schema validation failed"}`
            )
            invalidWarnings++
          }
          continue
        }

        const existing = await prisma.vote.findFirst({
          where: { externalId: parsed.data.externalId },
        })

        if (existing) {
          await prisma.vote.update({
            where: { id: existing.id },
            data: {
              date: parsed.data.date,
              type: parsed.data.type,
              outcome: parsed.data.outcome,
              description: parsed.data.description,
              sourceUrl: parsed.data.sourceUrl,
              externalId: parsed.data.externalId,
              confidence: "SCRAPED",
            },
          })
          updated++
        } else {
          const newVote = await prisma.vote.create({
            data: {
              date: parsed.data.date,
              type: parsed.data.type,
              outcome: parsed.data.outcome,
              description: parsed.data.description,
              sourceUrl: parsed.data.sourceUrl,
              externalId: parsed.data.externalId,
              confidence: "SCRAPED",
            },
          })

          await prisma.activityFeed.create({
            data: {
              type: "VOTE",
              title: `Vote: ${parsed.data.description ?? "Parliament vote"}`,
              summary: `Outcome: ${parsed.data.outcome}`,
              date: parsed.data.date,
              entityId: newVote.id,
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
        `[parliament-votes] Dropped ${invalidRows} row(s) due to schema validation failures`
      )
    }

    if (ambiguousRows > 0) {
      addScrapeContextWarning(
        `[parliament-votes] Skipped ${ambiguousRows} ambiguous row(s) without stable identity`
      )
    }

    if (records.length === 0) {
      addScrapeContextWarning(
        "[parliament-votes] No vote records extracted from House or National Assembly sources"
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
