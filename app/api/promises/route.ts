import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { success, error } from "@/lib/api-response"
import { PromiseStatus } from "@prisma/client"

// GET /api/promises?status=&category= — Promises list with aggregated stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const status = searchParams.get("status") as PromiseStatus | null
    const category = searchParams.get("category")

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (category) where.category = category

    const [data, total, byStatus, byCategory] = await Promise.all([
      prisma.promise.findMany({
        where,
        orderBy: { lastUpdated: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          category: true,
          status: true,
          source: true,
          confidence: true,
          evidenceUrl: true,
          lastUpdated: true,
        },
      }),
      prisma.promise.count({ where }),
      prisma.promise.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.promise.groupBy({
        by: ["category", "status"],
        _count: { status: true },
      }),
    ])

    // Build status summary
    const statusSummary: Record<string, number> = {
      KEPT: 0,
      IN_PROGRESS: 0,
      BROKEN: 0,
      NOT_STARTED: 0,
    }
    for (const g of byStatus) {
      statusSummary[g.status] = g._count.status
    }

    // Build per-category breakdown
    const categoryBreakdown: Record<string, Record<string, number>> = {}
    for (const g of byCategory) {
      if (!categoryBreakdown[g.category]) {
        categoryBreakdown[g.category] = { KEPT: 0, IN_PROGRESS: 0, BROKEN: 0, NOT_STARTED: 0 }
      }
      categoryBreakdown[g.category][g.status] = g._count.status
    }

    return success(data, { total, byStatus: statusSummary, byCategory: categoryBreakdown })
  } catch (e) {
    console.error("GET /api/promises error:", e)
    return error("Failed to fetch promises", 500)
  }
}
