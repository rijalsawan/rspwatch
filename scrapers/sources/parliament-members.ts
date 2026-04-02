import { createHash } from "node:crypto"
import * as cheerio from "cheerio"
import { prisma } from "@/lib/prisma"
import { ScrapedMemberSchema, type ScrapedMember } from "@/types/scraper"
import { SOURCES } from "@/config/scraping"
import { withScrapeLogging } from "../utils/logger"
import { cleanText, slugify } from "../utils/normalize"
import { addScrapeContextWarning } from "../utils/run-context"
import {
  buildChamberExternalId,
  containsDevanagari,
  discoverParliamentSources,
  PARLIAMENT_CHAMBERS,
  type ParliamentChamber,
  type ParliamentSourceCandidate,
} from "./parliament-connectors"

const config = SOURCES["parliament-members"]
const LOG_SOURCE = PARLIAMENT_CHAMBERS.map((chamber) => chamber.baseUrl).join(",")

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
]

interface ParsedMemberRow {
  name: string
  nameNepali?: string
  constituency?: string
  province?: string
  role?: string
  partyRaw?: string
  sourceUrl?: string
  photoUrl?: string
  fingerprint?: string
}

const META_KEYWORDS = [
  "constituency",
  "province",
  "district",
  "email",
  "phone",
  "party",
  "status",
  "प्रदेश",
  "निर्वाचन",
  "जिल्ला",
  "फोन",
  "इमेल",
]

const GENERIC_MEMBER_PATH_SEGMENTS = new Set([
  "members",
  "member",
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

function toStableMemberSourceUrl(pageUrl: string, rawUrl: string | undefined): string | undefined {
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
      queryKeys.some((key) => ["slug", "member", "profile", "post"].includes(key))

    if (GENERIC_MEMBER_PATH_SEGMENTS.has(lastSegment) && !hasIdentityQuery) {
      return undefined
    }

    return resolved.toString()
  } catch {
    return undefined
  }
}

function looksLikeName(text: string): boolean {
  if (text.length < 3) return false
  if (!/[A-Za-z\u0900-\u097F]/.test(text)) return false
  if (/^\d+$/.test(text)) return false
  const lower = text.toLowerCase()
  if (META_KEYWORDS.some((keyword) => lower.includes(keyword))) return false
  return true
}

function pickName(anchorText: string, textValues: string[]): string | undefined {
  if (looksLikeName(anchorText)) return anchorText
  return textValues.find((value) => looksLikeName(value))
}

function pickNameNepali(name: string, textValues: string[]): string | undefined {
  if (containsDevanagari(name)) return name
  return textValues.find((value) => containsDevanagari(value) && value !== name)
}

function pickByKeywords(textValues: string[], keywords: string[]): string | undefined {
  return textValues.find((value) => {
    const lower = value.toLowerCase()
    return keywords.some((keyword) => lower.includes(keyword.toLowerCase()))
  })
}

function parseMemberRowsFromHtml(
  html: string,
  chamber: ParliamentChamber,
  sourceUrl: string
): ParsedMemberRow[] {
  const $ = cheerio.load(html)
  const rows: ParsedMemberRow[] = []
  const seen = new Set<string>()

  const addRow = (row: ParsedMemberRow) => {
    const signature = `${row.name.toLowerCase()}|${row.sourceUrl ?? ""}|${row.fingerprint ?? ""}`
    if (seen.has(signature)) return
    seen.add(signature)
    rows.push(row)
  }

  $("table tbody tr, .member-item, .member-card, .team-item, .card").each((_, element) => {
    const $element = $(element)
    const textValues = $element
      .find("td, th, .name, .member-name, .designation, .title, p, span")
      .map((__, node) => cleanText($(node).text()))
      .get()
      .filter((value) => value.length > 1)

    const anchor = $element.find("a[href]").first()
    const anchorText = cleanText(anchor.text())
    const name = pickName(anchorText, textValues)
    if (!name) return

    const memberSourceUrl = toStableMemberSourceUrl(sourceUrl, anchor.attr("href"))
    const photoUrl = toAbsoluteUrl(sourceUrl, $element.find("img").first().attr("src"))

    const constituency = pickByKeywords(textValues, ["constituency", "निर्वाचन", "क्षेत्र"])
    const province = pickByKeywords(textValues, ["province", "प्रदेश"])
    const role = pickByKeywords(textValues, ["designation", "position", "पद", "सभामुख", "अध्यक्ष"])
    const partyRaw = pickByKeywords(textValues, ["party", "दल", "पार्टी", "congress", "uml", "rsp"])
    const fingerprint = cleanText($element.text()) || `${name}|${memberSourceUrl ?? ""}`

    addRow({
      name,
      nameNepali: pickNameNepali(name, textValues),
      constituency,
      province,
      role,
      partyRaw,
      sourceUrl: memberSourceUrl,
      photoUrl,
      fingerprint,
    })
  })

  if (rows.length === 0) {
    $("a[href]").each((_, element) => {
      const $element = $(element)
      const text = cleanText($element.text())
      const href = $element.attr("href")
      const memberSourceUrl = toStableMemberSourceUrl(sourceUrl, href)

      if (!looksLikeName(text)) return
      if (!memberSourceUrl) return

      const path = new URL(memberSourceUrl).pathname.toLowerCase()
      if (!path.includes("/members")) return

      addRow({
        name: text,
        nameNepali: containsDevanagari(text) ? text : undefined,
        constituency: chamber.name,
        province: "National",
        role: chamber.memberRole,
        sourceUrl: memberSourceUrl,
        fingerprint: `${text}|${memberSourceUrl}`,
      })
    })
  }

  return rows
}

async function getOrCreateParty(rawParty: string | undefined): Promise<string | null> {
  if (!rawParty) return null

  const normalized = cleanText(rawParty)
  if (!normalized) return null

  const lower = normalized.toLowerCase()
  const matched = PARTY_MAP.find((party) =>
    party.patterns.some((pattern) => lower.includes(pattern.toLowerCase()))
  )

  const canonical = matched ?? {
    name: normalized,
    nameNepali: containsDevanagari(normalized) ? normalized : normalized,
    abbreviation: normalized.slice(0, 8).toUpperCase(),
    color: "#6b7280",
  }

  const slugInput = matched ? canonical.abbreviation : canonical.name
  const slugCandidate = slugify(slugInput)
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  const slug =
    slugCandidate ||
    `party-${createHash("sha256").update(normalized).digest("hex").slice(0, 12)}`
  if (!slug) return null

  const party = await prisma.party.upsert({
    where: { slug },
    update: {
      name: canonical.name,
      nameNepali: canonical.nameNepali,
      abbreviation: canonical.abbreviation,
      color: canonical.color,
    },
    create: {
      slug,
      name: canonical.name,
      nameNepali: canonical.nameNepali,
      abbreviation: canonical.abbreviation,
      color: canonical.color,
      isActive: true,
    },
  })

  return party.id
}

function pickBestCandidate(
  chamber: ParliamentChamber,
  candidates: ParliamentSourceCandidate[]
): ParliamentSourceCandidate | null {
  if (candidates.length === 0) {
    addScrapeContextWarning(`[parliament-members] No source discovered for ${chamber.name}`)
    return null
  }

  for (const candidate of candidates) {
    const rows = parseMemberRowsFromHtml(candidate.html, chamber, candidate.url)
    if (rows.length > 0) return candidate
  }

  addScrapeContextWarning(
    `[parliament-members] Sources discovered but extraction yielded zero rows for ${chamber.name}`
  )
  return null
}

function buildSafeSlug(name: string, externalId: string): string {
  const normalized = slugify(name)
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

  const base = normalized || "member"
  const maxBaseLength = Math.max(1, 100 - (suffix.length + 1))
  const trimmedBase = base.slice(0, maxBaseLength)

  return `${trimmedBase}-${suffix}`
}

export async function scrapeParliamentMembers() {
  return withScrapeLogging("parliament-members", LOG_SOURCE, async () => {
    const records: ScrapedMember[] = []
    const seenExternalIds = new Set<string>()
    let created = 0
    let updated = 0
    let invalidRows = 0
    let invalidWarnings = 0
    let ambiguousRows = 0
    const rawHtmlParts: string[] = []

    const sourceMap = await discoverParliamentSources("members", {
      maxRetries: config.maxRetries,
      delayMs: config.requestDelayMs,
    })

    for (const chamber of PARLIAMENT_CHAMBERS) {
      const candidate = pickBestCandidate(chamber, sourceMap[chamber.key])
      if (!candidate) continue

      rawHtmlParts.push(`<!-- ${chamber.key}:${candidate.url} -->\n${candidate.html.slice(0, 20000)}`)
      const parsedRows = parseMemberRowsFromHtml(candidate.html, chamber, candidate.url)

      for (const row of parsedRows) {
        const sourceUrl = row.sourceUrl
        if (!sourceUrl && !row.fingerprint) {
          ambiguousRows++
          addScrapeContextWarning(
            `[parliament-members] Skipped ambiguous member row without stable identity for ${chamber.name}: ${row.name}`
          )
          continue
        }

        const normalizedName = cleanText(row.name)
        const normalizedConstituency = cleanText(row.constituency || chamber.name)
        const normalizedProvince = cleanText(row.province || "National")
        const normalizedRole = cleanText(row.role || chamber.memberRole)
        const normalizedParty = cleanText(row.partyRaw || "")
        const fallbackIdentity = [
          normalizedName,
          normalizedConstituency,
          normalizedProvince,
          normalizedRole,
          normalizedParty,
          candidate.url,
          row.fingerprint ?? "",
        ].join("|")

        const externalId = buildChamberExternalId(
          chamber.key,
          "member",
          sourceUrl,
          fallbackIdentity
        )

        if (seenExternalIds.has(externalId)) {
          ambiguousRows++
          addScrapeContextWarning(
            `[parliament-members] Skipped duplicate externalId in run for ${chamber.name}: ${externalId}`
          )
          continue
        }
        seenExternalIds.add(externalId)

        const memberPayload: ScrapedMember = {
          name: normalizedName,
          nameNepali: row.nameNepali ? cleanText(row.nameNepali) : undefined,
          constituency: normalizedConstituency,
          province: normalizedProvince,
          role: normalizedRole,
          photoUrl: row.photoUrl,
          externalId,
          sourceUrl,
        }

        const parsed = ScrapedMemberSchema.safeParse(memberPayload)
        if (!parsed.success) {
          invalidRows++
          if (invalidWarnings < 5) {
            const firstIssue = parsed.error.issues[0]
            addScrapeContextWarning(
              `[parliament-members] Dropped invalid row for ${chamber.name}: ${firstIssue?.path.join(".") ?? "unknown"} ${firstIssue?.message ?? "schema validation failed"}`
            )
            invalidWarnings++
          }
          continue
        }

        const partyId = await getOrCreateParty(row.partyRaw)
        const slug = buildSafeSlug(parsed.data.name, parsed.data.externalId ?? externalId)

        const existingByExternalId = parsed.data.externalId
          ? await prisma.member.findUnique({ where: { externalId: parsed.data.externalId } })
          : null
        const existingBySourceUrl =
          !existingByExternalId && parsed.data.sourceUrl
            ? await prisma.member.findFirst({ where: { sourceUrl: parsed.data.sourceUrl } })
            : null
        const existing = existingByExternalId ?? existingBySourceUrl

        if (existing) {
          await prisma.member.update({
            where: { id: existing.id },
            data: {
              name: parsed.data.name,
              nameNepali: parsed.data.nameNepali,
              role: parsed.data.role,
              designation: parsed.data.role,
              constituency: parsed.data.constituency,
              province: parsed.data.province,
              photoUrl: parsed.data.photoUrl,
              sourceUrl: parsed.data.sourceUrl,
              externalId: parsed.data.externalId,
              ...(partyId ? { partyId } : {}),
            },
          })
          updated++
        } else {
          await prisma.member.create({
            data: {
              slug,
              name: parsed.data.name,
              nameNepali: parsed.data.nameNepali,
              role: parsed.data.role,
              designation: parsed.data.role,
              constituency: parsed.data.constituency,
              province: parsed.data.province,
              photoUrl: parsed.data.photoUrl,
              sourceUrl: parsed.data.sourceUrl,
              externalId: parsed.data.externalId,
              isActive: true,
              ...(partyId ? { partyId } : {}),
            },
          })
          created++
        }

        records.push(parsed.data)
      }
    }

    if (invalidRows > 0) {
      addScrapeContextWarning(
        `[parliament-members] Dropped ${invalidRows} row(s) due to schema validation failures`
      )
    }

    if (ambiguousRows > 0) {
      addScrapeContextWarning(
        `[parliament-members] Skipped ${ambiguousRows} ambiguous row(s) without stable identity`
      )
    }

    if (records.length === 0) {
      addScrapeContextWarning(
        "[parliament-members] No member records extracted from House or National Assembly sources"
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
