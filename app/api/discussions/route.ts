import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { success, error } from "@/lib/api-response"
import { slugify } from "@/scrapers/utils/normalize"

export const dynamic = "force-dynamic"

interface DiscussionItem {
  id: string
  type: "LAW" | "CONTROVERSY"
  slug: string
  title: string
  summary: string
  category: string
  date: string
  severity?: string
  status?: string
  commentCount: number
  stance: { support: number; oppose: number; neutral: number }
  totalVotes: number
  member: { name: string; slug: string } | null
}

// GET /api/discussions?type=trending|law|controversy&search=&limit=&page=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const type = searchParams.get("type") ?? "trending"
    const search = searchParams.get("search") ?? ""
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50)
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
    const offset = (page - 1) * limit

    const searchFilter = search
      ? { title: { contains: search, mode: "insensitive" as const } }
      : {}

    const items: DiscussionItem[] = []
    let hasMore = false

    // ── Laws ────────────────────────────────────────────
    if (type === "trending" || type === "law") {
      // For trending, over-fetch across pages and merge-sort; for law, paginate directly
      const fetchLimit = type === "law" ? limit : limit * page
      const fetchSkip = type === "law" ? offset : 0

      const [laws, lawTotal] = await Promise.all([
        prisma.law.findMany({
          where: { ...searchFilter },
          orderBy: { proposedDate: "desc" },
          skip: fetchSkip,
          take: fetchLimit,
          select: {
            id: true,
            slug: true,
            title: true,
            summary: true,
            category: true,
            status: true,
            proposedDate: true,
            proposedBy: { select: { name: true, slug: true } },
            _count: { select: { comments: { where: { isArchived: false } } } },
          },
        }),
        type === "law" ? prisma.law.count({ where: searchFilter }) : Promise.resolve(0),
      ])

      for (const law of laws) {
        const stance = await getPollStance(law.id)
        items.push({
          id: law.id,
          type: "LAW",
          slug: law.slug,
          title: law.title,
          summary: law.summary,
          category: law.category,
          status: law.status,
          date: law.proposedDate?.toISOString() ?? new Date().toISOString(),
          commentCount: law._count.comments,
          stance: stance.percentages,
          totalVotes: stance.total,
          member: law.proposedBy,
        })
      }

      if (type === "law") hasMore = page * limit < lawTotal
    }

    // ── Controversies ─────────────────────────────────
    if (type === "trending" || type === "controversy") {
      const fetchLimit = type === "controversy" ? limit : limit * page
      const fetchSkip = type === "controversy" ? offset : 0

      const [controversies, controversyTotal] = await Promise.all([
        prisma.controversy.findMany({
          where: { ...searchFilter },
          orderBy: { date: "desc" },
          skip: fetchSkip,
          take: fetchLimit,
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            severity: true,
            date: true,
            isResolved: true,
            member: { select: { name: true, slug: true } },
            _count: { select: { comments: { where: { isArchived: false } } } },
          },
        }),
        type === "controversy" ? prisma.controversy.count({ where: searchFilter }) : Promise.resolve(0),
      ])

      for (const c of controversies) {
        // Auto-generate missing slugs
        let cSlug = c.slug
        if (!cSlug) {
          cSlug = slugify(c.title)
          const existing = await prisma.controversy.findFirst({
            where: { slug: cSlug, NOT: { id: c.id } },
          })
          if (existing) cSlug = `${cSlug}-${c.id.slice(-6)}`
          await prisma.controversy.update({ where: { id: c.id }, data: { slug: cSlug } })
        }

        const stance = await getPollStance(c.id)
        items.push({
          id: c.id,
          type: "CONTROVERSY",
          slug: cSlug,
          title: c.title,
          summary: c.description,
          category: c.isResolved ? "Resolved" : "Active",
          severity: c.severity,
          date: c.date.toISOString(),
          commentCount: c._count.comments,
          stance: stance.percentages,
          totalVotes: stance.total,
          member: c.member,
        })
      }

      if (type === "controversy") hasMore = page * limit < controversyTotal
    }

    // ── Sort & paginate trending ──────────────────────
    if (type === "trending") {
      items.sort((a, b) => {
        const engA = a.totalVotes + a.commentCount
        const engB = b.totalVotes + b.commentCount
        if (engB !== engA) return engB - engA
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })
      const paged = items.slice(offset, offset + limit)
      hasMore = items.length > offset + limit
      return success(paged, { page, hasMore })
    }

    return success(items, { page, hasMore })
  } catch (e) {
    console.error("GET /api/discussions error:", e)
    return error("Failed to fetch discussions", 500)
  }
}

// ─── helpers ──────────────────────────────────────────────────

async function getPollStance(entityId: string) {
  const poll = await prisma.poll.findUnique({
    where: { entityId },
    include: { options: { include: { _count: { select: { votes: true } } } } },
  })

  if (!poll || poll.options.length === 0) {
    return { total: 0, percentages: { support: 0, oppose: 0, neutral: 0 } }
  }

  const counts: Record<string, number> = {}
  let total = 0
  for (const opt of poll.options) {
    counts[opt.label.toLowerCase()] = opt._count.votes
    total += opt._count.votes
  }

  if (total === 0) return { total: 0, percentages: { support: 0, oppose: 0, neutral: 0 } }

  return {
    total,
    percentages: {
      support: Math.round(((counts["support"] ?? 0) / total) * 100),
      oppose: Math.round(((counts["oppose"] ?? 0) / total) * 100),
      neutral: Math.round(((counts["neutral"] ?? 0) / total) * 100),
    },
  }
}
