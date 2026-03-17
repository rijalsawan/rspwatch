import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { success, error } from "@/lib/api-response"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// POST /api/discussions/[slug]/comments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return error("Unauthorized", 401)

    const { slug } = await params
    const body = await request.json()

    const content = body.content?.trim()
    if (!content || content.length < 2 || content.length > 2000) {
      return error("Comment must be 2–2000 characters", 400)
    }

    // Validate parentId if provided — single-level only
    const parentId: string | null = body.parentId ?? null
    if (parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { parentId: true, isArchived: true },
      })
      if (!parent) return error("Parent comment not found", 404)
      if (parent.isArchived) return error("Cannot reply to a deleted comment", 410)
      if (parent.parentId !== null) return error("Nested replies are not allowed", 400)
    }

    // Identify entity — law first, then controversy
    const law = await prisma.law.findUnique({ where: { slug }, select: { id: true } })
    if (law) {
      const comment = await prisma.comment.create({
        data: { content, userId: session.user.id, lawId: law.id, parentId },
        select: {
          id: true, content: true, createdAt: true, parentId: true,
          user: { select: { id: true, name: true } },
        },
      })
      return success(comment, undefined, 201)
    }

    const controversy = await prisma.controversy.findUnique({ where: { slug }, select: { id: true } })
    if (controversy) {
      const comment = await prisma.comment.create({
        data: { content, userId: session.user.id, controversyId: controversy.id, parentId },
        select: {
          id: true, content: true, createdAt: true, parentId: true,
          user: { select: { id: true, name: true } },
        },
      })
      return success(comment, undefined, 201)
    }

    return error("Discussion not found", 404)
  } catch (e) {
    console.error("POST /api/discussions/[slug]/comments error:", e)
    return error("Failed to post comment", 500)
  }
}
