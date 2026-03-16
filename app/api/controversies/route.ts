import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { success, error } from "@/lib/api-response"

// GET /api/controversies — Flagged controversies with search and severity filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q") ?? ""
    const severity = searchParams.get("severity") ?? ""
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50)
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))

    const validSeverities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const
    type Severity = (typeof validSeverities)[number]
    const severityFilter =
      severity && severity !== "ALL" && validSeverities.includes(severity as Severity)
        ? (severity as Severity)
        : undefined

    const where = {
      ...(q && {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
        ],
      }),
      ...(severityFilter && { severity: severityFilter }),
    }

    const [controversies, total] = await Promise.all([
      prisma.controversy.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          severity: true,
          date: true,
          sourceUrl: true,
          isResolved: true,
          confidence: true,
          member: { select: { id: true, slug: true, name: true } },
        },
      }),
      prisma.controversy.count({ where }),
    ])

    return success(controversies, { total, page, limit, hasMore: page * limit < total })
  } catch (e) {
    console.error("GET /api/controversies error:", e)
    return error("Failed to fetch controversies", 500)
  }
}
