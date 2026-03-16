import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { paginated, error } from "@/lib/api-response"

// GET /api/votes?page=&limit= — Paginated votes list with breakdown
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1)
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100)

    const [votes, total] = await Promise.all([
      prisma.vote.findMany({
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          law: {
            select: { id: true, slug: true, title: true, code: true },
          },
          memberVotes: {
            select: { choice: true },
          },
        },
      }),
      prisma.vote.count(),
    ])

    // Compute breakdown for each vote
    const data = votes.map((vote) => {
      const breakdown = { yea: 0, nay: 0, abstain: 0, absent: 0 }
      for (const mv of vote.memberVotes) {
        if (mv.choice === "YEA") breakdown.yea++
        else if (mv.choice === "NAY") breakdown.nay++
        else if (mv.choice === "ABSTAIN") breakdown.abstain++
        else if (mv.choice === "ABSENT") breakdown.absent++
      }
      return {
        id: vote.id,
        date: vote.date,
        type: vote.type,
        outcome: vote.outcome,
        description: vote.description,
        law: vote.law,
        breakdown,
      }
    })

    return paginated(data, { total, page, limit })
  } catch (e) {
    console.error("GET /api/votes error:", e)
    return error("Failed to fetch votes", 500)
  }
}
