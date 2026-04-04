import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { success, error } from "@/lib/api-response"

// GET /api/parliament-calendar
// Aggregates recent parliamentary activity: laws, votes, appointments, grouped by date.
// Query params:
//   type (string): filter by activity type — "all" | "law" | "vote" | "appointment"
//   limit (number): default 30, max 100
//   page (number): default 1
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const type = searchParams.get("type") ?? "all"
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1)
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "30", 10), 100)
    const skip = (page - 1) * limit

    // Parallel queries for different activity types
    const [laws, votes, appointments, lawCount, voteCount, appointmentCount] = await Promise.all([
      type === "all" || type === "law"
        ? prisma.law.findMany({
            orderBy: { proposedDate: "desc" },
            take: type === "all" ? Math.ceil(limit / 3) : limit,
            skip: type === "law" ? skip : 0,
            select: {
              id: true,
              slug: true,
              title: true,
              titleNepali: true,
              status: true,
              category: true,
              proposedDate: true,
              passedDate: true,
              sourceUrl: true,
              confidence: true,
              proposedBy: { select: { id: true, slug: true, name: true } },
            },
          })
        : [],
      type === "all" || type === "vote"
        ? prisma.vote.findMany({
            orderBy: { date: "desc" },
            take: type === "all" ? Math.ceil(limit / 3) : limit,
            skip: type === "vote" ? skip : 0,
            select: {
              id: true,
              description: true,
              date: true,
              type: true,
              outcome: true,
              sourceUrl: true,
              confidence: true,
              law: { select: { id: true, slug: true, title: true } },
              _count: { select: { memberVotes: true } },
            },
          })
        : [],
      type === "all" || type === "appointment"
        ? prisma.appointment.findMany({
            orderBy: { date: "desc" },
            take: type === "all" ? Math.ceil(limit / 3) : limit,
            skip: type === "appointment" ? skip : 0,
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
          })
        : [],
      type === "law" ? prisma.law.count() : Promise.resolve(0),
      type === "vote" ? prisma.vote.count() : Promise.resolve(0),
      type === "appointment" ? prisma.appointment.count() : Promise.resolve(0),
    ])

    // Normalize into unified timeline items
    interface CalendarItem {
      id: string
      type: "law" | "vote" | "appointment"
      title: string
      subtitle: string | null
      date: string
      status: string | null
      sourceUrl: string | null
      confidence: string
      slug: string | null
      relatedMember: { id: string; slug: string; name: string } | null
      meta: Record<string, unknown>
    }

    const items: CalendarItem[] = []

    for (const law of laws) {
      items.push({
        id: law.id,
        type: "law",
        title: law.title,
        subtitle: law.titleNepali,
        date: (law.proposedDate ?? law.passedDate ?? new Date()).toISOString(),
        status: law.status,
        sourceUrl: law.sourceUrl,
        confidence: law.confidence,
        slug: law.slug,
        relatedMember: law.proposedBy,
        meta: { category: law.category },
      })
    }

    for (const vote of votes) {
      items.push({
        id: vote.id,
        type: "vote",
        title: vote.description ?? "Parliament Vote",
        subtitle: vote.law?.title ?? null,
        date: vote.date.toISOString(),
        status: vote.outcome,
        sourceUrl: vote.sourceUrl,
        confidence: vote.confidence,
        slug: null,
        relatedMember: null,
        meta: {
          voteType: vote.type,
          totalVoters: vote._count.memberVotes,
          lawSlug: vote.law?.slug,
        },
      })
    }

    for (const appt of appointments) {
      items.push({
        id: appt.id,
        type: "appointment",
        title: appt.title ?? `${appt.appointee} — ${appt.position}`,
        subtitle: appt.description,
        date: (appt.date ?? new Date()).toISOString(),
        status: null,
        sourceUrl: appt.sourceUrl,
        confidence: appt.confidence,
        slug: null,
        relatedMember: appt.member,
        meta: { position: appt.position, appointee: appt.appointee },
      })
    }

    // Sort all items by date descending
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // For "all" type, limit total items
    const sliced = type === "all" ? items.slice(0, limit) : items

    // Counts for summary
    const total =
      type === "law" ? lawCount :
      type === "vote" ? voteCount :
      type === "appointment" ? appointmentCount :
      sliced.length

    const totalPages = type === "all" ? 1 : Math.ceil(total / limit) || 1

    return success(sliced, {
      total,
      page,
      limit,
      totalPages,
      hasMore: type !== "all" && page < totalPages,
      counts: {
        laws: laws.length,
        votes: votes.length,
        appointments: appointments.length,
      },
    })
  } catch (e) {
    console.error("GET /api/parliament-calendar error:", e)
    return error("Failed to fetch parliament calendar", 500)
  }
}
