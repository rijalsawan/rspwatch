import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import { success, error } from "@/lib/api-response"

type LawWithVotes = Prisma.LawGetPayload<{
  include: {
    proposedBy: { select: { id: true; slug: true; name: true } }
    tags: { select: { id: true; name: true } }
    votes: {
      orderBy: { date: "desc" }
      include: {
        memberVotes: {
          select: {
            choice: true
            member: { select: { id: true; slug: true; name: true } }
          }
        }
      }
    }
  }
}>

// GET /api/laws/[slug] — Single law detail with votes and related statements
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const law: LawWithVotes | null = await prisma.law.findUnique({
      where: { slug },
      include: {
        proposedBy: {
          select: { id: true, slug: true, name: true },
        },
        tags: {
          select: { id: true, name: true },
        },
        votes: {
          orderBy: { date: "desc" },
          include: {
            memberVotes: {
              select: {
                choice: true,
                member: { select: { id: true, slug: true, name: true } },
              },
            },
          },
        },
      },
    })

    if (!law) {
      return error("Law not found", 404)
    }

    // Compute vote breakdowns for each vote session
    const votesWithBreakdown = law.votes.map((vote: LawWithVotes["votes"][number]) => {
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
        sourceUrl: vote.sourceUrl,
        breakdown,
        memberVotes: vote.memberVotes.map((mv) => ({
          memberId: mv.member.id,
          memberName: mv.member.name,
          memberSlug: mv.member.slug,
          choice: mv.choice,
        })),
      }
    })

    // Find related statements (mentioning this law's category or from sponsor)
    const relatedStatements = await prisma.statement.findMany({
      where: {
        OR: [
          { memberId: law.proposedById ?? undefined },
          { title: { contains: law.title.split(" ").slice(0, 3).join(" ") } },
        ],
      },
      take: 5,
      orderBy: { date: "desc" },
      select: {
        id: true,
        title: true,
        content: true,
        date: true,
        sourceUrl: true,
        member: { select: { id: true, slug: true, name: true } },
      },
    })

    return success({
      law: {
        id: law.id,
        slug: law.slug,
        title: law.title,
        titleNepali: law.titleNepali,
        code: law.code,
        status: law.status,
        category: law.category,
        summary: law.summary,
        fullText: law.fullText,
        sourceUrl: law.sourceUrl,
        proposedDate: law.proposedDate,
        passedDate: law.passedDate,
        enactedDate: law.enactedDate,
        confidence: law.confidence,
        proposedBy: law.proposedBy,
        tags: law.tags,
      },
      votes: votesWithBreakdown,
      relatedStatements,
    })
  } catch (e) {
    console.error("GET /api/laws/[slug] error:", e)
    return error("Failed to fetch law detail", 500)
  }
}
