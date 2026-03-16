import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateAdmin } from "@/lib/auth"
import { success, error } from "@/lib/api-response"

// GET /api/admin/logs?limit=&job= — View recent scrape logs
export async function GET(request: NextRequest) {
  const authError = validateAdmin(request)
  if (authError) return authError

  try {
    const { searchParams } = request.nextUrl
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200)
    const jobName = searchParams.get("job")

    const where: Record<string, unknown> = {}
    if (jobName) where.jobName = jobName

    const logs = await prisma.scrapeLog.findMany({
      where,
      orderBy: { ranAt: "desc" },
      take: limit,
      select: {
        id: true,
        jobName: true,
        sourceUrl: true,
        status: true,
        recordsFound: true,
        recordsCreated: true,
        recordsUpdated: true,
        errorMessage: true,
        durationMs: true,
        ranAt: true,
      },
    })

    return success(logs)
  } catch (e) {
    console.error("GET /api/admin/logs error:", e)
    return error("Failed to fetch scrape logs", 500)
  }
}
