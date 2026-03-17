import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { success, error } from "@/lib/api-response"

// Shared comment select — returns top-level comments with one level of replies
const COMMENT_SELECT = {
  where: { isArchived: false, parentId: null },
  orderBy: { createdAt: "desc" as const },
  take: 50,
  select: {
    id: true,
    content: true,
    createdAt: true,
    user: { select: { id: true, name: true } },
    replies: {
      where: { isArchived: false },
      orderBy: { createdAt: "asc" as const },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
      },
    },
  },
}

// GET /api/discussions/[slug]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Try law first
    const law = await prisma.law.findUnique({
      where: { slug },
      include: {
        proposedBy: { select: { id: true, slug: true, name: true } },
        tags: { select: { id: true, name: true } },
        comments: COMMENT_SELECT,
        _count: { select: { comments: { where: { isArchived: false } } } },
      },
    })

    if (law) {
      return success({
        type: "LAW" as const,
        id: law.id,
        slug: law.slug,
        title: law.title,
        titleNepali: law.titleNepali,
        description: law.summary,
        fullText: law.fullText,
        category: law.category,
        status: law.status,
        date: law.proposedDate?.toISOString() ?? law.createdAt.toISOString(),
        sourceUrl: law.sourceUrl,
        member: law.proposedBy,
        tags: law.tags,
        comments: law.comments,
        commentCount: law._count.comments,
      })
    }

    // Try controversy
    const controversy = await prisma.controversy.findUnique({
      where: { slug },
      include: {
        member: { select: { id: true, slug: true, name: true } },
        comments: COMMENT_SELECT,
        _count: { select: { comments: { where: { isArchived: false } } } },
      },
    })

    if (controversy) {
      return success({
        type: "CONTROVERSY" as const,
        id: controversy.id,
        slug: controversy.slug,
        title: controversy.title,
        titleNepali: null,
        description: controversy.description,
        fullText: null,
        category: controversy.isResolved ? "Resolved" : "Active",
        status: controversy.severity,
        date: controversy.date.toISOString(),
        sourceUrl: controversy.sourceUrl,
        member: controversy.member,
        tags: [],
        comments: controversy.comments,
        commentCount: controversy._count.comments,
      })
    }

    return error("Discussion not found", 404)
  } catch (e) {
    console.error("GET /api/discussions/[slug] error:", e)
    return error("Failed to fetch discussion", 500)
  }
}
