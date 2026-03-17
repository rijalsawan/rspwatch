import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const vote = await prisma.vote.findUnique({
    where: { id },
    select: { description: true, outcome: true, type: true, date: true },
  })

  if (!vote) return { title: "Vote Not Found" }

  const title = vote.description ?? `Parliamentary Vote — ${vote.type.replace("_", " ")}`
  const description = `${vote.outcome} — ${vote.type.replace("_", " ")} on ${new Date(vote.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. Full parliamentary roll-call breakdown on Parliament Watch.`

  return {
    title,
    description,
    openGraph: { title: `${title} | Parliament Watch`, description },
  }
}

export default function VoteDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
