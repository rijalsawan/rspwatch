import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { success, error } from "@/lib/api-response"

const RSP_API = "https://api.rspnepal.org"

// Source display names derived from sourceUrl
function getSourceLabel(sourceUrl: string | null): string {
  if (!sourceUrl) return "RSP Watch"
  if (sourceUrl.includes("kathmandupost.com")) return "The Kathmandu Post"
  if (sourceUrl.includes("onlinekhabar.com")) return "OnlineKhabar"
  if (sourceUrl.includes("rspnepal.org")) return "RSP Official"
  return "News"
}

function getSourceSlug(sourceUrl: string | null): string {
  if (!sourceUrl) return "rspwatch"
  if (sourceUrl.includes("kathmandupost.com")) return "kathmandu-post"
  if (sourceUrl.includes("onlinekhabar.com")) return "onlinekhabar"
  if (sourceUrl.includes("rspnepal.org")) return "rsp-official"
  return "news"
}

// GET /api/news
// Primary: reads from Statement table (scraped news data).
// Fallback: if DB returns zero results and no filters applied, proxies RSP API.
// Query params:
//   page (number): default 1
//   limit (number): default 12, max 50
//   q (string): search in title / content
//   source (string): filter by source (kathmandu-post, onlinekhabar, rsp-official)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1)
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "12", 10), 50)
    const q = searchParams.get("q")?.trim() ?? ""
    const source = searchParams.get("source") ?? ""

    // Build Prisma where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {}

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
      ]
    }

    if (source && source !== "all") {
      const sourceUrlMap: Record<string, string> = {
        "kathmandu-post": "kathmandupost.com",
        "onlinekhabar": "onlinekhabar.com",
        "rsp-official": "rspnepal.org",
      }
      const domainFilter = sourceUrlMap[source]
      if (domainFilter) {
        where.sourceUrl = { contains: domainFilter }
      }
    }

    const [items, total] = await Promise.all([
      prisma.statement.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          member: { select: { id: true, slug: true, name: true } },
        },
      }),
      prisma.statement.count({ where }),
    ])

    // If we have DB results, return them
    if (items.length > 0 || q || source) {
      const totalPages = Math.ceil(total / limit) || 1
      const data = items.map((item) => ({
        id: item.id,
        title: item.title,
        excerpt: item.content?.substring(0, 220) ?? "",
        content: item.content,
        sourceUrl: item.sourceUrl,
        sourceLabel: getSourceLabel(item.sourceUrl),
        sourceSlug: getSourceSlug(item.sourceUrl),
        date: item.date.toISOString(),
        confidence: item.confidence,
        member: item.member
          ? { id: item.member.id, slug: item.member.slug, name: item.member.name }
          : null,
      }))

      return success(data, { total, page, limit, totalPages, hasMore: page < totalPages })
    }

    // Fallback: no DB results and no filters — try RSP API
    return await fetchRspApiFallback(page, limit)
  } catch (e) {
    console.error("GET /api/news error:", e)
    return error("Failed to fetch news", 500)
  }
}

// Fallback to RSP official API when DB is empty
async function fetchRspApiFallback(page: number, limit: number) {
  try {
    interface RawBlogItem {
      _id: string
      createdAt: string
      title: string
      titleNp: string
      slug: string
      htmlDescription: string | null
      detail: string
      status: boolean
      tags: string[] | null
      coverImage: string
    }

    const res = await fetch(`${RSP_API}/blog-contents`, {
      headers: { Accept: "application/json", "User-Agent": "RSPWatch/1.0" },
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    })

    if (!res.ok) {
      return success([], { total: 0, page, limit, totalPages: 1, hasMore: false })
    }

    const raw: RawBlogItem[] = await res.json()
    const items = raw
      .filter((item) => item.status === true && (item.titleNp || item.title))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const total = items.length
    const totalPages = Math.ceil(total / limit) || 1
    const paginated = items.slice((page - 1) * limit, page * limit)

    const data = paginated.map((item) => ({
      id: item._id,
      title: item.titleNp || item.title,
      excerpt: stripHtml(item.htmlDescription || item.detail).substring(0, 220),
      content: null,
      sourceUrl: `https://rspnepal.org/news/${item.slug}`,
      sourceLabel: "RSP Official",
      sourceSlug: "rsp-official",
      date: item.createdAt,
      confidence: "SCRAPED" as const,
      member: null,
    }))

    return success(data, { total, page, limit, totalPages, hasMore: page < totalPages })
  } catch {
    return success([], { total: 0, page, limit, totalPages: 1, hasMore: false })
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
}
