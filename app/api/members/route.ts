import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { paginated, error } from "@/lib/api-response"
import { Prisma } from "@prisma/client"

// Executive roles for filtering (Central Committee, etc.)
const EXECUTIVE_ROLES = [
  "Party Chair",
  "Vice Chair",
  "General Secretary",
  "Secretary",
  "Treasurer",
  "Central Committee Member",
  "National Executive Member",
]

// Sort field mappings
type SortField = "name" | "role" | "province" | "attendance" | "createdAt"
const SORT_FIELDS: Record<SortField, string> = {
  name: "name",
  role: "role",
  province: "province",
  attendance: "attendancePercent",
  createdAt: "createdAt",
}

// GET /api/members — Members list with advanced filtering and pagination
// Query params:
//   - page (number): Page number, default 1
//   - limit (number): Results per page, max 200, default 50
//   - province (string): Filter by province
//   - q (string): Search by name, constituency, or role
//   - type (string): "executive" | "mp" | "all" - filter by member type
//   - role (string): Filter by exact role
//   - sort (string): Sort field - "name" | "role" | "province" | "attendance" | "createdAt"
//   - order (string): "asc" | "desc", default "asc"
//   - active (boolean): Filter by active status, default true
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1)
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200)
    const province = searchParams.get("province")
    const q = searchParams.get("q")
    const type = searchParams.get("type") // "executive" | "mp" | "all"
    const role = searchParams.get("role")
    const sortParam = searchParams.get("sort") as SortField | null
    const order = searchParams.get("order") === "desc" ? "desc" : "asc"
    const activeParam = searchParams.get("active")

    // Build WHERE clause
    const conditions: Prisma.MemberWhereInput[] = []

    // Active filter (defaults to true unless explicitly set)
    if (activeParam !== "false") {
      conditions.push({ isActive: true })
    }

    // Province filter
    if (province) {
      conditions.push({ province })
    }

    // Exact role filter
    if (role) {
      conditions.push({ role })
    }

    // Type filter: executive, mp, or all
    if (type === "executive") {
      // Executive members: Central Committee with specific roles OR National province
      conditions.push({
        OR: [
          { constituency: "Central Committee" },
          { province: "National" },
          { role: { in: EXECUTIVE_ROLES } },
        ],
      })
    } else if (type === "mp") {
      // MPs: Elected members with specific provinces (not National/Central)
      conditions.push({
        AND: [
          { constituency: { not: "Central Committee" } },
          { province: { not: "National" } },
        ],
      })
    }

    // Search filter
    if (q) {
      conditions.push({
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { nameNepali: { contains: q, mode: "insensitive" } },
          { constituency: { contains: q, mode: "insensitive" } },
          { role: { contains: q, mode: "insensitive" } },
        ],
      })
    }

    const where: Prisma.MemberWhereInput =
      conditions.length > 0 ? { AND: conditions } : {}

    // Build ORDER BY clause
    const sortField = sortParam && SORT_FIELDS[sortParam] ? SORT_FIELDS[sortParam] : "name"
    const orderBy: Prisma.MemberOrderByWithRelationInput[] = [
      { [sortField]: order },
    ]
    // Secondary sort by name if not already sorting by name
    if (sortField !== "name") {
      orderBy.push({ name: "asc" })
    }

    const [data, total] = await Promise.all([
      prisma.member.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          slug: true,
          name: true,
          nameNepali: true,
          photoUrl: true,
          phone: true,
          designation: true,
          constituency: true,
          province: true,
          role: true,
          isActive: true,
          attendancePercent: true,
          sourceUrl: true,
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
