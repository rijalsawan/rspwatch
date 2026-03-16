import { NextRequest } from "next/server"
import { success, error } from "@/lib/api-response"

const RSP_API = "https://api.rspnepal.org/events"
const IMAGE_BASE = "https://api.rspnepal.org/images/"
const PROXY_BASE = "/_proxy/rsp-images/"

interface RSPEvent {
  id: number
  _id: string
  titleEn: string | null
  titleNp: string | null
  slug: string
  status: boolean
  type: string | null
  descriptionEn: string | null
  descriptionNp: string | null
  image: string | null
  galleryId: string | null
  createdAt: string
  updatedAt: string
}

interface RSPEventsPage {
  results: RSPEvent[]
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
}

// GET /api/events — Live-proxied RSP official events
// Query params: page, limit, type (Completed | Upcoming)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1)
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "12", 10), 50)
    const upcoming = searchParams.get("upcoming") === "true"

    // Fetch all pages from RSP API to have full dataset for filtering
    const allEvents: RSPEvent[] = []
    let currentPage = 1
    let totalPages = 1

    do {
      const res = await fetch(`${RSP_API}?page=${currentPage}`, {
        next: { revalidate: 300 },
      })
      if (!res.ok) throw new Error(`RSP events API returned ${res.status}`)
      const data: RSPEventsPage = await res.json()
      totalPages = data.totalPages
      allEvents.push(...data.results)
      currentPage++
    } while (currentPage <= totalPages)

    // Filter active events
    let filtered = allEvents.filter((e) => e.status)

    // Filter by upcoming/completed
    if (upcoming) {
      filtered = filtered.filter((e) => e.type !== "Completed")
    }

    // Sort: upcoming first, then by date descending
    filtered.sort((a, b) => {
      // Non-completed (upcoming) events first
      if (a.type !== "Completed" && b.type === "Completed") return -1
      if (a.type === "Completed" && b.type !== "Completed") return 1
      // Then by creation date descending
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // Map to clean frontend shape
    const mapped = filtered.map((e) => ({
      id: e._id,
      title: e.titleEn?.trim() || e.titleNp?.trim() || "Untitled Event",
      titleNp: e.titleNp?.trim() || null,
      slug: e.slug,
      type: e.type || "Event",
      summary: e.descriptionEn?.trim() || e.descriptionNp?.trim() || null,
      summaryNp: e.descriptionNp?.trim() || null,
      date: e.createdAt,
      image: e.image ? e.image.replace(IMAGE_BASE, PROXY_BASE) : null,
      imageDirect: e.image,
      sourceUrl: `https://rspnepal.org/events/${e.slug}`,
      isCompleted: e.type === "Completed",
    }))

    // Client-side pagination
    const start = (page - 1) * limit
    const paged = mapped.slice(start, start + limit)
    const total = mapped.length
    const pageTotalPages = Math.ceil(total / limit) || 1

    return success(paged, {
      total,
      page,
      limit,
      totalPages: pageTotalPages,
      hasMore: page < pageTotalPages,
      source: "https://rspnepal.org/events",
      lastSynced: new Date().toISOString(),
    })
  } catch (e) {
    console.error("GET /api/events error:", e)
    return error("Failed to fetch events", 500)
  }
}
