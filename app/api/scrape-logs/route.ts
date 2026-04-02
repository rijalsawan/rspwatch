import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { paginated, error } from "@/lib/api-response"

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return parsed
}

// GET /api/scrape-logs — Public view of scrape history (non-sensitive data only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = parsePositiveInt(searchParams.get("page"), 1)
    const limit = Math.min(parsePositiveInt(searchParams.get("limit"), 20), 50)
    const jobName = searchParams.get("job")
    const runId = searchParams.get("runId")

    const where = {
      ...(jobName ? { jobName } : {}),
      ...(runId ? { ingestionRunId: runId } : {}),
    }

    const [data, total] = await Promise.all([
      prisma.scrapeLog.findMany({
        where,
        orderBy: { ranAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          jobName: true,
          ingestionRunId: true,
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
