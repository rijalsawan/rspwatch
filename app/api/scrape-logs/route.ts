import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { paginated, error } from "@/lib/api-response"

// GET /api/scrape-logs — Public view of scrape history (non-sensitive data only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1)
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50)
    const jobName = searchParams.get("job")

    const where = jobName ? { jobName } : {}

    const [data, total] = await Promise.all([
      prisma.scrapeLog.findMany({
        where,
        orderBy: { ranAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          jobName: true,
          status: true,
          recordsFound: true,
          recordsCreated: true,
          recordsUpdated: true,
          durationMs: true,
          ranAt: true,
          // Omit rawHtml and errorMessage for public view
        },
      }),
      prisma.scrapeLog.count({ where }),
    ])

    return paginated(data, { total, page, limit })
  } catch (e) {
    console.error("GET /api/scrape-logs error:", e)
    return error("Failed to fetch scrape logs", 500)
  }
}
