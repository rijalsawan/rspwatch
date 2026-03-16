import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { paginated, error } from "@/lib/api-response"

// GET /api/members?province=&q=&page=&limit= — Members list with search and filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1)
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200)
    const province = searchParams.get("province")
    const q = searchParams.get("q")

    const where: Record<string, unknown> = { isActive: true }
    if (province) where.province = province
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { constituency: { contains: q, mode: "insensitive" } },
        { role: { contains: q, mode: "insensitive" } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.member.findMany({
        where,
        orderBy: [{ role: "asc" }, { name: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          slug: true,
          name: true,
          photoUrl: true,
          constituency: true,
          province: true,
          role: true,
          isActive: true,
          attendancePercent: true,
        },
      }),
      prisma.member.count({ where }),
    ])

    return paginated(data, { total, page, limit })
  } catch (e) {
    console.error("GET /api/members error:", e)
    return error("Failed to fetch members", 500)
  }
}
