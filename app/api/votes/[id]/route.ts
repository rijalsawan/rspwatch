import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { success, error } from "@/lib/api-response"

// GET /api/votes/[id] — Vote detail with full MP breakdown
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const vote = await prisma.vote.findUnique({
      where: { id },
      include: {
        law: {
          select: { id: true, slug: true, title: true, code: true },
        },
        memberVotes: {
          select: {
            choice: true,
            member: {
              select: {
                id: true,
                slug: true,
                name: true,
                party: { select: { abbreviation: true, color: true } },
              },
            },
          },
          orderBy: { member: { name: "asc" } },
        },
      },
    })

    if (!vote) {
      return error("Vote not found", 404)
    }

    const breakdown = { yea: 0, nay: 0, abstain: 0, absent: 0 }
    for (const mv of vote.memberVotes) {
      if (mv.choice === "YEA") breakdown.yea++
      else if (mv.choice === "NAY") breakdown.nay++
      else if (mv.choice === "ABSTAIN") breakdown.abstain++
      else if (mv.choice === "ABSENT") breakdown.absent++
    }

    return success({
      vote: {
        id: vote.id,
        date: vote.date,
        type: vote.type,
        outcome: vote.outcome,
        description: vote.description,
        sourceUrl: vote.sourceUrl,
        law: vote.law,
        breakdown,
      },
      memberVotes: vote.memberVotes.map((mv) => ({
        memberId: mv.member.id,
        memberName: mv.member.name,
        memberSlug: mv.member.slug,
        choice: mv.choice,
        party: mv.member.party
          ? { abbreviation: mv.member.party.abbreviation, color: mv.member.party.color }
          : null,
      })),
    })
  } catch (e) {
    console.error("GET /api/votes/[id] error:", e)
    return error("Failed to fetch vote detail", 500)
  }
}
