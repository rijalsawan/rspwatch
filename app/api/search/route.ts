import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { success } from "@/lib/api-response"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim() ?? ""
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "8"), 20)

  // No query → return recommended content
  if (!q) {
    const [members, laws, promises] = await Promise.all([
      prisma.member.findMany({
        where: { isActive: true },
        take: 4,
        select: { slug: true, name: true, role: true, constituency: true, province: true },
        orderBy: { name: "asc" },
      }),
      prisma.law.findMany({
        take: 4,
        select: { slug: true, title: true, status: true, category: true, code: true },
        orderBy: { proposedDate: "desc" },
      }),
      prisma.promise.findMany({
        take: 4,
        select: { slug: true, title: true, status: true, category: true },
        orderBy: { lastUpdated: "desc" },
      }),
    ])
    return success({ members, laws, promises, statements: [], query: "" }, { total: 0 })
  }

  const searchTerm = { contains: q, mode: "insensitive" as const }

  const [members, laws, promises, statements] = await Promise.all([
    prisma.member.findMany({
      where: {
        OR: [
          { name: searchTerm },
          { constituency: searchTerm },
          { province: searchTerm },
          { role: searchTerm },
        ],
      },
      take: limit,
      select: {
        slug: true,
        name: true,
        role: true,
        constituency: true,
        province: true,
        isActive: true,
      },
    }),
    prisma.law.findMany({
      where: {
        OR: [
          { title: searchTerm },
          { summary: searchTerm },
          { category: searchTerm },
          { code: searchTerm },
          { titleNepali: searchTerm },
        ],
      },
      take: limit,
      select: {
        slug: true,
        title: true,
        status: true,
        category: true,
        summary: true,
        code: true,
        proposedDate: true,
      },
    }),
    prisma.promise.findMany({
      where: {
        OR: [
          { title: searchTerm },
          { description: searchTerm },
          { category: searchTerm },
        ],
      },
      take: limit,
      select: {
        slug: true,
        title: true,
        status: true,
        category: true,
        description: true,
      },
    }),
    prisma.statement.findMany({
      where: {
        OR: [
          { title: searchTerm },
          { content: searchTerm },
        ],
      },
      take: limit,
      select: {
        id: true,
        title: true,
        content: true,
        date: true,
        member: { select: { name: true, slug: true } },
      },
    }),
  ])

  const total =
    members.length + laws.length + promises.length + statements.length

  return success({ members, laws, promises, statements, query: q }, { total })
}
