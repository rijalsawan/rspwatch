import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { validateAdmin } from "@/lib/auth"
import { success, error } from "@/lib/api-response"

const createLawSchema = z.object({
  title: z.string().min(1),
  titleNepali: z.string().optional(),
  code: z.string().optional(),
  status: z.enum(["DRAFT", "PROPOSED", "COMMITTEE", "PASSED", "REJECTED", "ENACTED"]),
  category: z.string().min(1),
  summary: z.string().min(1),
  fullText: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  proposedDate: z.coerce.date().optional(),
  passedDate: z.coerce.date().optional(),
  enactedDate: z.coerce.date().optional(),
  proposedById: z.string().optional(),
  tags: z.array(z.string()).optional(), // tag names
  confidence: z.enum(["SCRAPED", "VERIFIED", "MANUAL"]).default("MANUAL"),
})

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .substring(0, 100)
}

// POST /api/admin/laws — Create or update a law record
export async function POST(request: NextRequest) {
  const authError = validateAdmin(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const parsed = createLawSchema.safeParse(body)

    if (!parsed.success) {
      return error(`Validation failed: ${parsed.error.flatten().fieldErrors}`, 400)
    }

    const { tags, ...lawData } = parsed.data
    const slug = slugify(lawData.title)

    // Check if law with this slug already exists (update) or create new
    const existing = await prisma.law.findUnique({ where: { slug } })

    const tagConnections = tags
      ? {
          connectOrCreate: tags.map((name) => ({
            where: { name },
            create: { name },
          })),
        }
      : undefined

    const law = existing
      ? await prisma.law.update({
          where: { slug },
          data: { ...lawData, tags: tagConnections },
          include: { tags: { select: { name: true } } },
        })
      : await prisma.law.create({
          data: { ...lawData, slug, tags: tagConnections },
          include: { tags: { select: { name: true } } },
        })

    // Add to activity feed
    await prisma.activityFeed.create({
      data: {
        type: "LAW",
        title: `${existing ? "Updated" : "New"}: ${law.title}`,
        summary: law.summary,
        date: law.proposedDate ?? new Date(),
        entityId: law.id,
        entitySlug: law.slug,
        relatedMemberId: law.proposedById,
      },
    })

    return success(law, undefined, existing ? 200 : 201)
  } catch (e) {
    console.error("POST /api/admin/laws error:", e)
    return error("Failed to create/update law", 500)
  }
}
