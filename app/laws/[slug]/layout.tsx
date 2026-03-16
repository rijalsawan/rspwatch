import type { Metadata } from "next"
import Script from "next/script"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ slug: string }>
  children: React.ReactNode
}

async function getLaw(slug: string) {
  return prisma.law.findUnique({
    where: { slug },
    select: {
      title: true,
      titleNepali: true,
      summary: true,
      status: true,
      category: true,
      code: true,
      proposedDate: true,
      proposedBy: { select: { name: true } },
    },
  })
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const law = await getLaw(slug)

  if (!law) notFound()

  const title = law.code ? `${law.title} (${law.code})` : law.title
  const description = law.summary
    ? law.summary.length > 160
      ? law.summary.slice(0, 157) + "..."
      : law.summary
    : `Details on ${law.title} — a ${law.status.toLowerCase()} ${law.category} bill tracked by RSP Watch.`

  return {
    title,
    description,
    openGraph: {
      title: `${title} | RSP Watch`,
      description,
    },
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rspwatch.np"

export default async function LawDetailLayout({ params, children }: Props) {
  const { slug } = await params
  const law = await getLaw(slug)

  if (!law) return children

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Legislation",
    name: law.title,
    ...(law.titleNepali && { alternateName: law.titleNepali }),
    ...(law.summary && { description: law.summary }),
    ...(law.code && { legislationIdentifier: law.code }),
    legislationStatus: law.status.toLowerCase(),
    ...(law.proposedDate && { datePublished: law.proposedDate.toISOString().split("T")[0] }),
    ...(law.proposedBy && {
      sponsor: { "@type": "Person", name: law.proposedBy.name },
    }),
    legislationJurisdiction: "Nepal",
    url: `${SITE_URL}/laws/${slug}`,
  }

  return (
    <>
      {children}
      <Script
        id={`schema-law-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  )
}
