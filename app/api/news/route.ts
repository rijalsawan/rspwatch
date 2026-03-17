import { NextRequest } from "next/server"
import { success, error } from "@/lib/api-response"

const RSP_API = "https://api.rspnepal.org"
const IMAGE_BASE = `${RSP_API}/images/blog-contents/`
const PROXY_BASE = "/_proxy/rsp-images/blog-contents/"

interface RawBlogItem {
  id: number
  _id: string
  createdAt: string
  updatedAt: string
  title: string
  titleNp: string
  slug: string
  htmlTitle: string
  htmlDescription: string | null
  detail: string
  status: boolean
  tags: string[] | null
  coverImage: string
  galleryId: number | null
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

// GET /api/news
// Fetches live from RSP official API, returning published blog posts with cover images.
// Query params:
//   page (number): default 1
//   limit (number): default 12, max 50
//   q (string): search in title / titleNp
//   category (string): "news" | "press" — filter by slug tag
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1)
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "12", 10), 50)
    const q = searchParams.get("q")?.toLowerCase().trim() ?? ""
    const category = searchParams.get("category") ?? ""

    const res = await fetch(`${RSP_API}/blog-contents`, {
      headers: { Accept: "application/json", "User-Agent": "RSPWatch/1.0" },
      cache: "no-store", // Don't cache raw response (8.6MB exceeds Next.js 2MB limit)
    })

    if (!res.ok) {
      return error(`RSP API returned ${res.status}`, 502)
    }

    const raw: RawBlogItem[] = await res.json()

    // Filter to published only, skip items with no useful content
    let items = raw.filter((item) => item.status === true && (item.titleNp || item.title))

    // Category filter by tags
    if (category && category !== "all") {
      items = items.filter((item) =>
        Array.isArray(item.tags) && item.tags.some((t) => t.toLowerCase() === category)
      )
    }

    // Search filter
    if (q) {
      items = items.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.titleNp?.toLowerCase().includes(q) ||
          item.htmlDescription?.toLowerCase().includes(q) ||
          (item.tags ?? []).some((t) => t.toLowerCase().includes(q))
      )
    }

    // Sort newest first
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const total = items.length
    const totalPages = Math.ceil(total / limit)
    const paginated = items.slice((page - 1) * limit, page * limit)

    const data = paginated.map((item) => ({
      id: item._id,
      slug: item.slug,
      title: item.title,
      titleNp: item.titleNp,
      excerpt: item.htmlDescription
        ? stripHtml(item.htmlDescription).substring(0, 220)
        : stripHtml(item.detail).substring(0, 220),
      // Proxy image URL to avoid CORP blocking
      coverImage: item.coverImage
        ? PROXY_BASE + item.coverImage
        : null,
      coverImageDirect: item.coverImage
        ? IMAGE_BASE + item.coverImage
        : null,
      tags: item.tags ?? [],
      sourceUrl: `https://rspnepal.org/news/${item.slug}`,
      date: item.createdAt,
    }))

    return success(data, { total, page, limit, totalPages, hasMore: page < totalPages })
  } catch (e) {
    console.error("GET /api/news error:", e)
    return error("Failed to fetch news", 500)
  }
}
