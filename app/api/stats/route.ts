import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { success, error } from "@/lib/api-response"

// GET /api/stats — Dashboard live stats
export async function GET(_request: NextRequest) {
  try {
    const RSP_GOVERNANCE_START = new Date(process.env.RSP_GOVERNANCE_START ?? "2026-03-01")
    const now = new Date()
    const daysInPower = Math.floor(
      (now.getTime() - RSP_GOVERNANCE_START.getTime()) / (1000 * 60 * 60 * 24)
    )

    const [lawsPassed, promisesTracked, activeMps, totalVotes, promisesByStatus] =
      await Promise.all([
        prisma.law.count({ where: { status: { in: ["PASSED", "ENACTED"] } } }),
        prisma.promise.count(),
        prisma.member.count({ where: { isActive: true } }),
        prisma.vote.count(),
        prisma.promise.groupBy({
          by: ["status"],
          _count: { status: true },
        }),
      ])

    const statusMap: Record<string, number> = {
      KEPT: 0,
      IN_PROGRESS: 0,
      BROKEN: 0,
      NOT_STARTED: 0,
    }
    for (const group of promisesByStatus) {
      statusMap[group.status] = group._count.status
    }

    return success({
      lawsPassed,
      promisesTracked,
      promisesKept: statusMap.KEPT,
      daysInPower,
      activeMps,
      totalVotes,
      promisesByStatus: statusMap,
    })
  } catch (e) {
    console.error("GET /api/stats error:", e)
    return error("Failed to fetch stats", 500)
  }
}
