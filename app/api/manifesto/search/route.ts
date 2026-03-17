import { NextRequest } from "next/server"
import { searchManifesto, isManifestoIndexAvailable } from "@/lib/manifesto-index"
import { success, error } from "@/lib/api-response"

// GET /api/manifesto/search?q=<query>&limit=<n>
// Returns top manifesto excerpts for the given query.
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim() ?? ""
    const limit = Math.min(10, parseInt(request.nextUrl.searchParams.get("limit") ?? "3", 10))

    if (q.length < 2) {
      return error("Query must be at least 2 characters", 400)
    }

    const matches = await searchManifesto(q, limit)

    // loadChunks() runs inside searchManifesto — check availability after
    if (!isManifestoIndexAvailable()) {
      return error(
        "Manifesto search is unavailable: the PDF appears to be image-based and contains no extractable text.",
        503
      )
    }

    return success(matches, { query: q, found: matches.length })
  } catch (e) {
    console.error("GET /api/manifesto/search error:", e)
    return error("Search failed", 500)
  }
}
