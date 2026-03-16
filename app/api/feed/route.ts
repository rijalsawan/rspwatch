import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { cursorPaginated, error } from "@/lib/api-response"

// GET /api/feed?limit=&cursor= — Unified timeline with cursor pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100)
    const cursor = searchParams.get("cursor")
    const type = searchParams.get("type")

    const where: Record<string, unknown> = {}
    if (type) where.type = type

    const items = await prisma.activityFeed.findMany({
      where,
      take: limit + 1, // fetch one extra to determine hasMore
      orderBy: { date: "desc" },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        relatedMember: {
          select: { id: true, slug: true, name: true },
        },
      },
    })

    const hasMore = items.length > limit
    const data = hasMore ? items.slice(0, limit) : items
    const nextCursor = hasMore ? data[data.length - 1].id : null

    return cursorPaginated(data, { limit, nextCursor })
  } catch (e) {
    console.error("GET /api/feed error:", e)
    return error("Failed to fetch activity feed", 500)
  }
}
