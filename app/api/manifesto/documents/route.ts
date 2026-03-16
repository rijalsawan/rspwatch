import { NextRequest } from "next/server"
import { success, error } from "@/lib/api-response"

const RSP_API = "https://api.rspnepal.org/downloads"
const IMAGE_BASE = "https://api.rspnepal.org/images/"
const PROXY_BASE = "/_proxy/rsp-images/"

interface RSPDownload {
  id: number
  _id: string
  title: string
  fileName: string
  position: number
  status: boolean
  downloadCount: number
  image: string
  downloadUrl: string
  createdAt: string
  updatedAt: string
}

interface RSPDownloadsPage {
  results: RSPDownload[]
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
}

// GET /api/manifesto/documents — Live-proxied RSP official downloads
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get("page") ?? "1", 10)

    // Fetch all pages from RSP API to get complete list
    const allDocs: RSPDownload[] = []
    let currentPage = 1
    let totalPages = 1

    do {
      const res = await fetch(`${RSP_API}?page=${currentPage}`, {
        next: { revalidate: 300 }, // Cache for 5 minutes
      })
      if (!res.ok) throw new Error(`RSP API returned ${res.status}`)
      const data: RSPDownloadsPage = await res.json()
      totalPages = data.totalPages
      allDocs.push(...data.results)
      currentPage++
    } while (currentPage <= totalPages)

    // Filter active documents, sort by position then by most downloaded
    const active = allDocs
      .filter((d) => d.status)
      .sort((a, b) => a.position - b.position || b.downloadCount - a.downloadCount)

    // Map to clean shape with proxied images
    const documents = active.map((doc) => ({
      id: doc._id,
      title: doc.title.trim(),
      fileName: doc.fileName,
      coverImage: doc.image.replace(IMAGE_BASE, PROXY_BASE),
      coverImageDirect: doc.image,
      downloadUrl: doc.downloadUrl,
      downloadCount: doc.downloadCount,
      publishedAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }))

    // Paginate client-side if requested
    const limit = parseInt(searchParams.get("limit") ?? "50", 10)
    const start = (page - 1) * limit
    const paged = documents.slice(start, start + limit)

    return success(paged, {
      total: documents.length,
      page,
      limit,
      totalPages: Math.ceil(documents.length / limit) || 1,
      hasMore: start + limit < documents.length,
      source: "https://rspnepal.org/downloads",
      lastSynced: new Date().toISOString(),
    })
  } catch (e) {
    console.error("GET /api/manifesto/documents error:", e)
    return error("Failed to fetch RSP documents", 500)
  }
}
