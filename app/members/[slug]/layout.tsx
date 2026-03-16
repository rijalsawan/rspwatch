import type { Metadata } from "next"
import Script from "next/script"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ slug: string }>
  children: React.ReactNode
}

async function getMember(slug: string) {
  return prisma.member.findUnique({
    where: { slug },
    select: { name: true, nameNepali: true, photoUrl: true, constituency: true, province: true, role: true },
  })
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const member = await getMember(slug)

  if (!member) notFound()

  const title = member.nameNepali ? `${member.name} (${member.nameNepali})` : member.name
  const description = `${member.name} — RSP ${member.role} representing ${member.constituency}, ${member.province}. View attendance, voting record, sponsored bills, and statements.`

  return {
    title,
    description,
    openGraph: {
      title: `${title} | RSP Watch`,
      description,
      ...(member.photoUrl && {
        images: [{ url: member.photoUrl, alt: member.name }],
      }),
    },
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rspwatch.np"

export default async function MemberDetailLayout({ params, children }: Props) {
  const { slug } = await params
  const member = await getMember(slug)

  if (!member) return children

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: member.name,
    ...(member.nameNepali && { alternateName: member.nameNepali }),
    ...(member.photoUrl && { image: member.photoUrl }),
    jobTitle: member.role,
    worksFor: {
      "@type": "Organization",
      name: "Rastriya Swatantra Party",
    },
    memberOf: {
      "@type": "Organization",
      name: "Federal Parliament of Nepal",
    },
    url: `${SITE_URL}/members/${slug}`,
  }

  return (
    <>
      {children}
      <Script
        id={`schema-member-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  )
}
