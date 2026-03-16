import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { success, error } from "@/lib/api-response"

// GET /api/members/[slug] — Full member detail with activity
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const member = await prisma.member.findUnique({
      where: { slug },
      include: {
        proposedLaws: {
          orderBy: { proposedDate: "desc" },
          select: {
            id: true,
            slug: true,
            title: true,
            code: true,
            status: true,
            category: true,
            summary: true,
            proposedDate: true,
            passedDate: true,
          },
        },
        memberVotes: {
          orderBy: { vote: { date: "desc" } },
          take: 20,
          select: {
            choice: true,
            vote: {
              select: {
                id: true,
                date: true,
                description: true,
                type: true,
                outcome: true,
                law: { select: { title: true, slug: true } },
              },
            },
          },
        },
        statements: {
          orderBy: { date: "desc" },
          take: 10,
          select: {
            id: true,
            title: true,
            content: true,
            date: true,
            sourceUrl: true,
          },
        },
      },
    })

    if (!member) {
      return error("Member not found", 404)
    }

    // Reshape vote history for cleaner output
    const voteHistory = member.memberVotes.map((mv) => ({
      voteId: mv.vote.id,
      date: mv.vote.date,
      description: mv.vote.description,
      type: mv.vote.type,
      outcome: mv.vote.outcome,
      lawTitle: mv.vote.law?.title ?? null,
      lawSlug: mv.vote.law?.slug ?? null,
      choice: mv.choice,
    }))

    return success({
      member: {
        id: member.id,
        slug: member.slug,
        name: member.name,
        nameNepali: member.nameNepali,
        photoUrl: member.photoUrl,
        constituency: member.constituency,
        province: member.province,
        role: member.role,
        isActive: member.isActive,
        attendancePercent: member.attendancePercent,
      },
      proposedLaws: member.proposedLaws,
      voteHistory,
      statements: member.statements,
    })
  } catch (e) {
    console.error("GET /api/members/[slug] error:", e)
    return error("Failed to fetch member detail", 500)
  }
}
