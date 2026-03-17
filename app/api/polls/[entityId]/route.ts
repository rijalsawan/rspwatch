import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ entityId: string }> }) {
  const { entityId } = await params
  const searchParams = request.nextUrl.searchParams
  const entityType = searchParams.get("type") || "LAW"
  const session = await getServerSession(authOptions)

  // Find the poll
  let poll = await prisma.poll.findUnique({
    where: { entityId },
    include: {
      options: {
        include: {
          _count: { select: { votes: true } }
        }
      }
    }
  })

  // Auto-create poll for entity if it doesn't exist
  if (!poll) {
    poll = await prisma.poll.create({
      data: {
        entityId,
        entityType: entityType as any,
        question: "What is your stance?",
        options: {
          create: [
            { label: "Support" },
            { label: "Oppose" },
            { label: "Neutral" }
          ]
        }
      },
      include: {
        options: {
          include: {
            _count: { select: { votes: true } }
          }
        }
      }
    })
  }

  // Check if user voted
  let userVote = null
  if (session?.user?.id) {
    const vote = await prisma.pollVote.findFirst({
      where: {
        pollId: poll.id,
        userId: session.user.id
      }
    })
    if (vote) userVote = vote.optionId
  }

  return NextResponse.json({ poll, userVote })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ entityId: string }> }) {
  const { entityId } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { optionId } = body

  if (!optionId) return NextResponse.json({ error: "Missing optionId" }, { status: 400 })

  const poll = await prisma.poll.findUnique({ where: { entityId } })
  if (!poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 })
  }

  // Check if user already voted
  const existingVote = await prisma.pollVote.findUnique({
    where: {
      pollId_userId: {
        pollId: poll.id,
        userId: session.user.id
      }
    }
  })

  if (existingVote) {
    // User is changing their vote — update it
    if (existingVote.optionId === optionId) {
      // Voting for same option again = undo
      await prisma.pollVote.delete({
        where: { id: existingVote.id }
      })
    } else {
      // Voting for different option = change vote
      await prisma.pollVote.update({
        where: { id: existingVote.id },
        data: { optionId }
      })
    }
  } else {
    // Cast new vote
    await prisma.pollVote.create({
      data: {
        pollId: poll.id,
        optionId,
        userId: session.user.id
      }
    })
  }

  // Return updated poll
  const updatedPoll = await prisma.poll.findUnique({
    where: { id: poll.id },
    include: {
      options: {
        include: {
          _count: { select: { votes: true } }
        }
      }
    }
  })

  // Get user's current vote
  const userVote = await prisma.pollVote.findUnique({
    where: {
      pollId_userId: {
        pollId: poll.id,
        userId: session.user.id
      }
    }
  })

  return NextResponse.json({ poll: updatedPoll, userVote: userVote?.optionId || null })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ entityId: string }> }) {
  const { entityId } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const poll = await prisma.poll.findUnique({ where: { entityId } })
  if (!poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 })
  }

  // Delete user's vote if it exists
  await prisma.pollVote.deleteMany({
    where: {
      pollId: poll.id,
      userId: session.user.id
    }
  })

  // Return updated poll
  const updatedPoll = await prisma.poll.findUnique({
    where: { id: poll.id },
    include: {
      options: {
        include: {
          _count: { select: { votes: true } }
        }
      }
    }
  })

  return NextResponse.json({ poll: updatedPoll, userVote: null })
}

