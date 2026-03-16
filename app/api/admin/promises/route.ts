import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { validateAdmin } from "@/lib/auth"
import { success, error } from "@/lib/api-response"

const updatePromiseSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  status: z.enum(["KEPT", "IN_PROGRESS", "BROKEN", "NOT_STARTED"]).optional(),
  evidenceUrl: z.string().url().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  source: z.enum(["MANIFESTO", "CITIZEN_CONTRACT", "SPEECH", "POLICY_BRIEF"]).optional(),
  confidence: z.enum(["SCRAPED", "VERIFIED", "MANUAL"]).optional(),
}).refine((data) => data.id || data.slug, {
  message: "Either id or slug must be provided",
})

// POST /api/admin/promises — Update promise status or details
export async function POST(request: NextRequest) {
  const authError = validateAdmin(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const parsed = updatePromiseSchema.safeParse(body)

    if (!parsed.success) {
      return error(`Validation failed: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`, 400)
    }

    const { id, slug, ...updateData } = parsed.data

    const where = id ? { id } : { slug: slug! }
    const existing = await prisma.promise.findUnique({ where })

    if (!existing) {
      return error("Promise not found", 404)
    }

    const promise = await prisma.promise.update({
      where: { id: existing.id },
      data: {
        ...updateData,
        lastUpdated: new Date(),
      },
    })

    // Log to activity feed if status changed
    if (updateData.status && updateData.status !== existing.status) {
      await prisma.activityFeed.create({
        data: {
          type: "PROMISE_UPDATE",
          title: `Promise ${updateData.status.toLowerCase().replace("_", " ")}: ${promise.title}`,
          summary: promise.description,
          date: new Date(),
          entityId: promise.id,
          entitySlug: promise.slug,
        },
      })
    }

    return success(promise)
  } catch (e) {
    console.error("POST /api/admin/promises error:", e)
    return error("Failed to update promise", 500)
  }
}
