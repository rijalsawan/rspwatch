import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { paginated, error } from "@/lib/api-response"
import { LawStatus } from "@prisma/client"

// GET /api/laws?page=&limit=&status=&category=&sort=&proposedBy= — Paginated laws list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1)
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100)
    const status = searchParams.get("status") as LawStatus | null
    const category = searchParams.get("category")
    const sort = searchParams.get("sort") ?? "proposedDate"
    const sortDir = searchParams.get("dir") === "asc" ? "asc" : ("desc" as const)
    const proposedBy = searchParams.get("proposedBy")

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (category) where.category = category
    if (proposedBy) where.proposedById = proposedBy

    const orderBy: Record<string, string> = {}
    if (sort === "title") orderBy.title = sortDir
    else if (sort === "status") orderBy.status = sortDir
    else orderBy.proposedDate = sortDir

    const [data, total] = await Promise.all([
      prisma.law.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          code: true,
          status: true,
          category: true,
          summary: true,
          proposedDate: true,
          passedDate: true,
          proposedBy: {
            select: { id: true, slug: true, name: true },
          },
          tags: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.law.count({ where }),
    ])

    return paginated(data, { total, page, limit })
  } catch (e) {
    console.error("GET /api/laws error:", e)
    return error("Failed to fetch laws", 500)
  }
}
