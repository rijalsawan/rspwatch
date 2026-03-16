import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { success, error } from "@/lib/api-response"

// Infer a display category from the position title
function inferCategory(position: string): "Cabinet" | "Committee" | "Structural" {
  const p = position.toLowerCase()
  if (p.includes("minister") || p.includes("prime minister") || p.includes("cabinet")) return "Cabinet"
  if (p.includes("committee") || p.includes("commission")) return "Committee"
  return "Structural"
}

// GET /api/appointments — Cabinet and government appointments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category") ?? ""
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50)
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          appointee: true,
          position: true,
          date: true,
          description: true,
          sourceUrl: true,
          confidence: true,
          member: { select: { id: true, slug: true, name: true } },
        },
      }),
      prisma.appointment.count(),
    ])

    // Derive category and apply optional client-side filter
    const enriched = appointments
      .map((a) => ({ ...a, category: inferCategory(a.position) }))
      .filter((a) => !category || category === "All" || a.category === category)

    return success(enriched, { total, page, limit, hasMore: page * limit < total })
  } catch (e) {
    console.error("GET /api/appointments error:", e)
    return error("Failed to fetch appointments", 500)
  }
}
