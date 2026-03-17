import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { success, error } from "@/lib/api-response"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { validateAdmin } from "@/lib/auth"

// DELETE /api/discussions/[slug]/comments/[commentId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return error("Unauthorized", 401)

    const { commentId } = await params

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true, isArchived: true },
    })

    if (!comment) return error("Comment not found", 404)
    if (comment.isArchived) return error("Already deleted", 410)

    // Allow deletion if user is the author OR if they have admin privileges
    const isAdmin = validateAdmin(request) === null
    const isAuthor = comment.userId === session.user.id

    if (!isAuthor && !isAdmin) return error("Forbidden", 403)

    await prisma.comment.update({
      where: { id: commentId },
      data: { isArchived: true },
    })

    return success({ deleted: true })
  } catch (e) {
    console.error("DELETE /api/discussions/[slug]/comments/[commentId] error:", e)
    return error("Failed to delete comment", 500)
  }
}

