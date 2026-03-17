// Scraper: RSP Official Website — Party data from api.rspnepal.org
// Sources:
//   - https://api.rspnepal.org/dashboard          → executive members, blog categories, timeline
//   - https://api.rspnepal.org/executive-members  → full executive member list (paginated)
//   - https://api.rspnepal.org/blog-contents      → full press releases & news archive
//
// NOTE: Events are NOT scraped here; /api/events is a live proxy to api.rspnepal.org/events.
// Engine: JSON API (no browser needed)

import { prisma } from "@/lib/prisma"
import { withScrapeLogging } from "../utils/logger"
import { slugify, cleanText } from "../utils/normalize"
import { SOURCES } from "@/config/scraping"

const config = SOURCES["rsp-official"]
const API = config.baseUrl // https://api.rspnepal.org

const HEADERS = {
  Accept: "application/json",
  "User-Agent": "ParliamentWatch/1.0 (+https://parliamentwatch.np)",
}

// ─── Types matching api.rspnepal.org response ──────────────────

interface ExecutiveMember {
  id: number
  _id: string
  nameEn?: string   // API uses nameEn not name
  nameNp?: string
  name?: string     // Fallback for older format
  designationEn?: string  // API uses designationEn not designation
  designationNp?: string
  designation?: string    // Fallback for older format
  image: string | null
  mobileNumber?: string | null  // API uses mobileNumber not phone
  phone?: string | null         // Fallback for older format
  position: number
  status?: boolean
  createdAt: string
  updatedAt: string
}

interface BlogContent {
  id: number
  _id: string
  slug: string
  title: string
  titleNp?: string
  htmlTitle?: string
  htmlDescription?: string
  detail?: string
  coverImage?: string
  tags?: string[] | null
  status: boolean
  createdAt: string
  updatedAt: string
}

interface BlogCategory {
  id: number
  _id: string
  title: string
  slug: string
  blogs: BlogContent[]
}

interface TimelineMonth {
  id: number
  _id: string
  month: string
  monthNp?: string
  events: TimelineEvent[]
}

interface TimelineEvent {
  id: number
  _id: string
  title: string
  titleNp?: string
  description?: string
  descriptionNp?: string
  image?: string
  createdAt: string
}

interface DashboardResponse {
  blogCategories?: BlogCategory[]
  executiveMembers?: ExecutiveMember[]
  timeline?: TimelineMonth[]
  [key: string]: unknown
}

// ─── Main scraper ──────────────────────────────────────────────

export async function scrapeRspOfficial() {
  return withScrapeLogging("rsp-official", API, async () => {
    const records: unknown[] = []
    let created = 0
    let updated = 0

    // 1. Fetch dashboard for executive members, events, timeline
    const dashRes = await fetch(`${API}/dashboard`, {
      headers: HEADERS,
      signal: AbortSignal.timeout(30000),
    })
    if (!dashRes.ok) {
      throw new Error(`RSP Dashboard API returned ${dashRes.status}: ${dashRes.statusText}`)
    }
    const dashboard: DashboardResponse = await dashRes.json()
    const rawHtml = JSON.stringify(dashboard).substring(0, 50000)

    // 2. Fetch full blog content archive
    const blogRes = await fetch(`${API}/blog-contents?pageSize=100`, {
      headers: HEADERS,
      signal: AbortSignal.timeout(30000),
    })
    const blogData: { items?: BlogContent[] } = blogRes.ok ? await blogRes.json() : { items: [] }

    // ─── Extract Executive Members ───────────────────────────
    const memberResult = await extractExecutiveMembers(dashboard)
    records.push(...memberResult.records)
    created += memberResult.created
    updated += memberResult.updated

    // ─── Extract Press Releases & News ───────────────────────
    const pressResult = await extractBlogContent(dashboard, blogData.items ?? [])
    records.push(...pressResult.records)
    created += pressResult.created
    updated += pressResult.updated

    // ─── Extract Timeline ────────────────────────────────────
    const timelineResult = await extractTimeline(dashboard)
    records.push(...timelineResult.records)
    created += timelineResult.created
    updated += timelineResult.updated

    return { records, created, updated, rawHtml }
  })
}

// ─── Executive Members ─────────────────────────────────────────

interface ExecutiveMembersPage {
  results: ExecutiveMember[]
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
  next: number
  previous: number
}

async function extractExecutiveMembers(_dashboard: DashboardResponse) {
  const records: ExecutiveMember[] = []
  let created = 0
  let updated = 0

  // Ensure the RSP party record exists
  const rspParty = await prisma.party.upsert({
    where: { slug: "rsp" },
    update: {},
    create: {
      slug: "rsp",
      name: "Rastriya Swatantra Party",
      nameNepali: "राष्ट्रिय स्वतन्त्र पार्टी",
      abbreviation: "RSP",
      color: "#0ea5e9",
      website: "https://rspnepal.org",
    },
  })
  const rspPartyId = rspParty.id

  // Fetch all executive members from the dedicated endpoint (paginated API)
  // The API returns: { results: [...], totalPages: 10, pageSize: 10, totalItems: 93 }
  let members: ExecutiveMember[] = []

  try {
    // First fetch to get total pages
    const firstRes = await fetch(`${API}/executive-members`, {
      headers: HEADERS,
      signal: AbortSignal.timeout(30000),
    })

    if (firstRes.ok) {
      const firstPage: ExecutiveMembersPage = await firstRes.json()
      members.push(...firstPage.results)

      // Fetch remaining pages
      const totalPages = firstPage.totalPages || 1
      for (let page = 2; page <= totalPages; page++) {
        try {
          const pageRes = await fetch(`${API}/executive-members?page=${page}`, {
            headers: HEADERS,
            signal: AbortSignal.timeout(30000),
          })
          if (pageRes.ok) {
            const pageData: ExecutiveMembersPage = await pageRes.json()
            members.push(...pageData.results)
          }
        } catch (pageErr) {
          console.warn(`[rsp-official] Failed to fetch page ${page}:`, pageErr)
        }
      }
    }
  } catch (err) {
    console.warn("[rsp-official] Failed to fetch /executive-members, falling back to dashboard data:", err)
  }

  // Fallback to dashboard data if dedicated endpoint failed
  if (members.length === 0) {
    const dashboardData = (_dashboard as Record<string, unknown>).dashboardData
    if (Array.isArray(dashboardData)) {
      for (const mod of dashboardData) {
        if (mod && typeof mod === "object" && "name" in mod && mod.name === "Executive Members") {
          members = Array.isArray(mod.data) ? mod.data as ExecutiveMember[] : []
          break
        }
      }
    }
    if (members.length === 0 && Array.isArray(_dashboard.executiveMembers)) {
      members = _dashboard.executiveMembers
    }
  }

  console.log(`[rsp-official] Processing ${members.length} executive members`)

  for (const m of members) {
    // Use the new API field names with fallbacks
    const rawName = m.nameEn || m.name || m.nameNp
    if (!rawName) continue

    // Skip inactive members
    if (m.status === false) continue

    const name = cleanText(rawName)
    const slug = slugify(name)
    if (!slug) continue

    const photoUrl = m.image
      ? m.image.startsWith("http") ? m.image : `${API}/images/executive-members/${m.image}`
      : undefined

    // Store the original designation in Nepali if available
    const designation = cleanText(m.designationNp || m.designationEn || m.designation || "")
    // Create an English role from designation
    const role = cleanText(m.designationEn || m.designation || m.designationNp || "Central Committee Member")
    const phone = m.mobileNumber || m.phone ? cleanText(m.mobileNumber || m.phone || "") : null
    const nameNepali = m.nameNp ? cleanText(m.nameNp) : null
    const externalId = `rsp-exec-${m._id || m.id}`

    records.push(m)

    const existing = await prisma.member.findFirst({
      where: { OR: [{ externalId }, { slug }] },
    })

    if (existing) {
      await prisma.member.update({
        where: { id: existing.id },
        data: {
          name,
          nameNepali: nameNepali || existing.nameNepali,
          role,
          designation: designation || existing.designation,
          phone: phone ?? existing.phone,
          photoUrl: photoUrl ?? existing.photoUrl,
          externalId,
          sourceUrl: "https://rspnepal.org/executive-members",
          partyId: rspPartyId,
        },
      })
      updated++
    } else {
      await prisma.member.create({
        data: {
          slug,
          name,
          nameNepali,
          role,
          designation: designation || null,
          phone,
          constituency: "Central Committee",
          province: "National",
          photoUrl,
          externalId,
          sourceUrl: "https://rspnepal.org/executive-members",
          isActive: true,
          partyId: rspPartyId,
        },
      })
      created++
    }
  }

  return { records, created, updated }
}

// ─── Blog Content (Press + News) ──────────────────────────────

async function extractBlogContent(
  dashboard: DashboardResponse,
  blogItems: BlogContent[]
) {
  const records: BlogContent[] = []
  let created = 0
  let updated = 0

  // Collect blogs from both sources, dedupe by _id
  const seenIds = new Set<string>()
  const allBlogs: BlogContent[] = []

  // From dashboard blog categories
  const dashboardData = (dashboard as Record<string, unknown>).dashboardData
  if (Array.isArray(dashboardData)) {
    for (const mod of dashboardData) {
      if (mod && typeof mod === "object" && "data" in mod && Array.isArray(mod.data)) {
        for (const item of mod.data) {
          if (item && typeof item === "object" && "blogs" in item && Array.isArray(item.blogs)) {
            for (const blog of item.blogs as BlogContent[]) {
              if (blog._id && !seenIds.has(blog._id)) {
                seenIds.add(blog._id)
                allBlogs.push(blog)
              }
            }
          }
        }
      }
    }
  }

  // Also check top-level blogCategories
  if (Array.isArray(dashboard.blogCategories)) {
    for (const cat of dashboard.blogCategories) {
      if (Array.isArray(cat.blogs)) {
        for (const blog of cat.blogs) {
          if (blog._id && !seenIds.has(blog._id)) {
            seenIds.add(blog._id)
            allBlogs.push(blog)
          }
        }
      }
    }
  }

  // From the full /blog-contents endpoint
  for (const blog of blogItems) {
    if (blog._id && !seenIds.has(blog._id)) {
      seenIds.add(blog._id)
      allBlogs.push(blog)
    }
  }

  for (const blog of allBlogs) {
    if (!blog.title && !blog.titleNp) continue
    // Skip inactive entries
    if (blog.status === false) continue

    const title = cleanText(blog.title || blog.titleNp || "")
    if (!title) continue

    const sourceUrl = `https://rspnepal.org/blog/${blog.slug}`
    const content = cleanText(stripHtml(blog.htmlDescription || blog.detail || ""))
      .substring(0, 2000)

    records.push(blog)

    // Store as Statement (press releases are party statements)
    const existing = await prisma.statement.findFirst({
      where: { sourceUrl },
    })

    if (!existing) {
      const date = new Date(blog.createdAt)
      if (isNaN(date.getTime())) continue

      const newStatement = await prisma.statement.create({
        data: {
          title: title.substring(0, 500),
          content: content || title,
          date,
          sourceUrl,
          confidence: "SCRAPED",
        },
      })

      // Add to activity feed
      await prisma.activityFeed.create({
        data: {
          type: "STATEMENT",
          title: title.substring(0, 500),
          summary: content.substring(0, 200) || undefined,
          date,
          entityId: newStatement.id,
          sourceUrl,
        },
      })

      created++
    } else {
      // Update content if changed
      if (content && content !== existing.content) {
        await prisma.statement.update({
          where: { id: existing.id },
          data: {
            title: title.substring(0, 500),
            content,
          },
        })
      }
      updated++
    }
  }

  return { records, created, updated }
}

// ─── Timeline ────────────────────────────────────────────────

async function extractTimeline(dashboard: DashboardResponse) {
  const records: TimelineEvent[] = []
  let created = 0
  let updated = 0

  // Timeline may be in dashboardData modules or top-level
  let timelineMonths: TimelineMonth[] = []

  const dashboardData = (dashboard as Record<string, unknown>).dashboardData
  if (Array.isArray(dashboardData)) {
    for (const mod of dashboardData) {
      if (mod && typeof mod === "object" && "name" in mod && mod.name === "Timeline") {
        const modData = (mod as { data: unknown }).data
        if (Array.isArray(modData)) {
          timelineMonths = modData as TimelineMonth[]
        }
        break
      }
    }
  }

  if (timelineMonths.length === 0 && Array.isArray(dashboard.timeline)) {
    timelineMonths = dashboard.timeline
  }

  for (const month of timelineMonths) {
    if (!Array.isArray(month.events)) continue

    for (const event of month.events) {
      if (!event.title && !event.titleNp) continue

      const title = cleanText(event.title || event.titleNp || "")
      if (!title) continue

      const entityId = `rsp-timeline-${event._id || event.id}`

      records.push(event)

      const existing = await prisma.activityFeed.findFirst({
        where: { entityId },
      })

      if (!existing) {
        const date = new Date(event.createdAt)
        if (isNaN(date.getTime())) continue

        const description = cleanText(
          stripHtml(event.description || event.descriptionNp || "")
        ).substring(0, 200)

        await prisma.activityFeed.create({
          data: {
            type: "STATEMENT",
            title: title.substring(0, 500),
            summary: description || `Timeline: ${month.month || ""}`,
            date,
            entityId,
          },
        })
        created++
      } else {
        updated++
      }
    }
  }

  return { records, created, updated }
}

// ─── Helpers ──────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "") // strip injected iframes
    .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
}
