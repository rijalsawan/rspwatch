import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rspwatch.np"

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${siteUrl}/laws`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/members`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/promises`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/votes`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/timeline`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ]

  // Dynamic: law detail pages
  const laws = await prisma.law.findMany({
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  })

  const lawPages: MetadataRoute.Sitemap = laws.map((law) => ({
    url: `${siteUrl}/laws/${law.slug}`,
    lastModified: law.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  // Dynamic: member detail pages
  const members = await prisma.member.findMany({
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  })

  const memberPages: MetadataRoute.Sitemap = members.map((member) => ({
    url: `${siteUrl}/members/${member.slug}`,
    lastModified: member.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  return [...staticPages, ...lawPages, ...memberPages]
}
