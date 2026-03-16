import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { success, error } from "@/lib/api-response"

// GET /api/statements — Public statements list with optional search and member filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q") ?? ""
    const memberId = searchParams.get("memberId") ?? ""
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50)
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))

    const where = {
      ...(q && {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { content: { contains: q, mode: "insensitive" as const } },
        ],
      }),
      ...(memberId && { memberId }),
    }

    const [statements, total] = await Promise.all([
      prisma.statement.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          content: true,
          date: true,
          sourceUrl: true,
          confidence: true,
          member: { select: { id: true, slug: true, name: true } },
        },
      }),
      prisma.statement.count({ where }),
    ])

    return success(statements, { total, page, limit, hasMore: page * limit < total })
  } catch (e) {
    console.error("GET /api/statements error:", e)
    return error("Failed to fetch statements", 500)
  }
}
