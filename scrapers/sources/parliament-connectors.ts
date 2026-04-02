import { createHash } from "node:crypto"
import * as cheerio from "cheerio"
import { fetchRawHtml } from "../utils/http"
import { cleanText, slugify } from "../utils/normalize"

export type ParliamentSourceType = "members" | "bills" | "votes"
export type ParliamentChamberKey = "hr" | "na"

export interface ParliamentChamber {
  key: ParliamentChamberKey
  name: string
  memberRole: string
  baseUrl: string
}

export interface ParliamentSourceCandidate {
  chamber: ParliamentChamber
  url: string
  html: string
  score: number
}

interface DiscoverOptions {
  maxRetries?: number
  delayMs?: number
}

export const PARLIAMENT_CHAMBERS: ParliamentChamber[] = [
  {
    key: "hr",
    name: "House of Representatives",
    memberRole: "Member of House of Representatives",
    baseUrl: "https://hr.parliament.gov.np",
  },
  {
    key: "na",
    name: "National Assembly",
    memberRole: "Member of National Assembly",
    baseUrl: "https://na.parliament.gov.np",
  },
]

const LANDING_PATHS = ["/np", "/en", "/"]

const SOURCE_PATH_HINTS: Record<ParliamentSourceType, string[]> = {
  members: [
    "/np/members",
    "/en/members",
    "/np/members/parliament",
    "/en/members/parliament",
  ],
  bills: [
    "/np/bills",
    "/en/bills",
    "/np/post/bills",
    "/en/post/bills",
    "/np/acts-codes",
    "/en/acts-codes",
    "/np/acts",
    "/en/acts",
  ],
  votes: [
    "/np/votes",
    "/en/votes",
    "/np/post/voting-records",
    "/en/post/voting-records",
    "/np/verbatims",
    "/en/verbatims",
    "/np/today-parliament",
    "/en/today-parliament",
  ],
}

const SOURCE_KEYWORDS: Record<ParliamentSourceType, string[]> = {
  members: ["member", "members", "sadasya", "सदस्य", "माननीय"],
  bills: ["bill", "bills", "act", "acts", "code", "codes", "विधेयक", "ऐन", "नियम"],
  votes: ["vote", "voting", "verbatim", "मतदान", "मत", "वोट", "record"],
}

const GENERIC_ID_SEGMENTS = new Set([
  "members",
  "member",
  "bills",
  "bill",
  "votes",
  "vote",
  "view",
  "detail",
  "details",
  "post",
  "posts",
  "index",
  "list",
  "today-parliament",
  "verbatims",
])

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.hash = ""
    return parsed.toString()
  } catch {
    return url
  }
}

function canonicalizeUrlForIdentity(url: string): string | null {
  try {
    const parsed = new URL(url)
    parsed.hash = ""

    const sortedEntries = Array.from(parsed.searchParams.entries()).sort((left, right) => {
      if (left[0] === right[0]) {
        return left[1].localeCompare(right[1])
      }
      return left[0].localeCompare(right[0])
    })

    parsed.search = ""
    for (const [key, value] of sortedEntries) {
      parsed.searchParams.append(key, value)
    }

    return parsed.toString()
  } catch {
    return null
  }
}

function toAbsoluteUrl(baseUrl: string, href: string): string | null {
  try {
    const absolute = new URL(href, baseUrl)
    if (absolute.protocol !== "http:" && absolute.protocol !== "https:") {
      return null
    }
    return normalizeUrl(absolute.toString())
  } catch {
    return null
  }
}

function normalizeIdSegment(value: string): string {
  return value.replace(/-+/g, "-").replace(/^-|-$/g, "")
}

function isStrongIdSegment(value: string): boolean {
  return /[a-z0-9]/.test(value)
}

function hasAnyKeyword(text: string, keywords: string[]): boolean {
  const normalized = text.toLowerCase()
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))
}

function countKeywordHits(text: string, keywords: string[]): number {
  const normalized = text.toLowerCase()
  return keywords.reduce((hits, keyword) => {
    return normalized.includes(keyword.toLowerCase()) ? hits + 1 : hits
  }, 0)
}

async function tryFetchHtml(url: string, options: DiscoverOptions): Promise<string | null> {
  try {
    return await fetchRawHtml(url, {
      retries: options.maxRetries ?? 3,
      delayMs: options.delayMs ?? 2000,
    })
  } catch {
    return null
  }
}

function collectHintLinks(
  baseUrl: string,
  html: string,
  sourceType: ParliamentSourceType
): string[] {
  const links: string[] = []
  const keywords = SOURCE_KEYWORDS[sourceType]
  const baseHostname = new URL(baseUrl).hostname
  const $ = cheerio.load(html)

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href")
    if (!href) return

    const absolute = toAbsoluteUrl(baseUrl, href)
    if (!absolute) return

    const absoluteUrl = new URL(absolute)
    if (absoluteUrl.hostname !== baseHostname) return

    const text = cleanText($(element).text())
    const combined = `${absoluteUrl.pathname} ${text}`
    if (!hasAnyKeyword(combined, keywords)) return

    links.push(absolute)
  })

  return Array.from(new Set(links))
}

function scoreCandidatePage(
  sourceType: ParliamentSourceType,
  candidateUrl: string,
  html: string
): number {
  const $ = cheerio.load(html)
  const bodyText = cleanText($("body").text())
  const keywordScore = countKeywordHits(bodyText, SOURCE_KEYWORDS[sourceType]) * 5
  const tableScore = Math.min($("table tbody tr").length, 20)
  const linkScore = Math.min(Math.floor($("a[href]").length / 25), 5)

  const path = new URL(candidateUrl).pathname.toLowerCase()
  const pathScore =
    sourceType === "members"
      ? path.includes("/members")
        ? 20
        : 0
      : sourceType === "bills"
      ? path.includes("bill") || path.includes("acts") || path.includes("code")
        ? 14
        : 0
      : path.includes("vote") || path.includes("verbatim") || path.includes("today-parliament")
      ? 14
      : 0

  return keywordScore + tableScore + linkScore + pathScore
}

async function discoverSourcesForChamber(
  sourceType: ParliamentSourceType,
  chamber: ParliamentChamber,
  options: DiscoverOptions
): Promise<ParliamentSourceCandidate[]> {
  const seededCandidates = SOURCE_PATH_HINTS[sourceType]
    .map((path) => toAbsoluteUrl(chamber.baseUrl, path))
    .filter((value): value is string => Boolean(value))

  const landingUrls = LANDING_PATHS
    .map((path) => toAbsoluteUrl(chamber.baseUrl, path))
    .filter((value): value is string => Boolean(value))

  const dynamicCandidates: string[] = []
  for (const landingUrl of landingUrls) {
    const landingHtml = await tryFetchHtml(landingUrl, options)
    if (!landingHtml) continue
    dynamicCandidates.push(...collectHintLinks(landingUrl, landingHtml, sourceType))
  }

  const candidateUrls = Array.from(
    new Set([...seededCandidates, ...dynamicCandidates].map((url) => normalizeUrl(url)))
  )

  const resolvedCandidates: ParliamentSourceCandidate[] = []
  for (const candidateUrl of candidateUrls) {
    const html = await tryFetchHtml(candidateUrl, options)
    if (!html) continue

    const score = scoreCandidatePage(sourceType, candidateUrl, html)
    if (score <= 0) continue

    resolvedCandidates.push({
      chamber,
      url: candidateUrl,
      html,
      score,
    })
  }

  return resolvedCandidates.sort((left, right) => right.score - left.score)
}

export async function discoverParliamentSources(
  sourceType: ParliamentSourceType,
  options: DiscoverOptions = {}
): Promise<Record<ParliamentChamberKey, ParliamentSourceCandidate[]>> {
  const output: Record<ParliamentChamberKey, ParliamentSourceCandidate[]> = {
    hr: [],
    na: [],
  }

  for (const chamber of PARLIAMENT_CHAMBERS) {
    output[chamber.key] = await discoverSourcesForChamber(sourceType, chamber, options)
  }

  return output
}

export function extractStableIdSegment(url: string): string | null {
  try {
    const pathname = new URL(url).pathname
    const segments = pathname.split("/").filter(Boolean)
    if (segments.length === 0) return null

    const last = decodeURIComponent(segments[segments.length - 1])
    if (!last) {
      return null
    }

    const lower = last.toLowerCase()
    if (GENERIC_ID_SEGMENTS.has(lower)) {
      return null
    }

    const normalized = normalizeIdSegment(slugify(last))
    if (!normalized || !isStrongIdSegment(normalized)) return null

    return normalized
  } catch {
    return null
  }
}

function buildStableHash(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 16)
}

export function buildChamberExternalId(
  chamberKey: ParliamentChamberKey,
  entityPrefix: "member" | "bill" | "vote",
  sourceUrl: string | undefined,
  fallbackText: string
): string {
  if (sourceUrl) {
    const stableId = extractStableIdSegment(sourceUrl)
    const canonicalSourceUrl = canonicalizeUrlForIdentity(sourceUrl)

    if (stableId && canonicalSourceUrl) {
      const canonical = new URL(canonicalSourceUrl)
      const hasQueryIdentity = canonical.searchParams.toString().length > 0
      if (!hasQueryIdentity) {
        return `${chamberKey}-${entityPrefix}-${stableId}`
      }

      const sourceHash = buildStableHash(canonicalSourceUrl).slice(0, 8)
      return `${chamberKey}-${entityPrefix}-${stableId}-${sourceHash}`
    }

    if (canonicalSourceUrl) {
      return `${chamberKey}-${entityPrefix}-${buildStableHash(canonicalSourceUrl)}`
    }

    if (stableId) {
      return `${chamberKey}-${entityPrefix}-${stableId}`
    }
  }

  const slugCandidate = normalizeIdSegment(slugify(fallbackText)).slice(0, 64)
  if (slugCandidate && isStrongIdSegment(slugCandidate)) {
    return `${chamberKey}-${entityPrefix}-${slugCandidate}`
  }

  const hashInput = `${chamberKey}|${entityPrefix}|${sourceUrl ?? ""}|${fallbackText}`
  return `${chamberKey}-${entityPrefix}-${buildStableHash(hashInput)}`
}

export function containsDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text)
}
