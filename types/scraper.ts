import { z } from "zod"

// ─── Scraper result types ────────────────────────────────────
// Each scraper returns one of these typed arrays.

export const ScrapedMemberSchema = z.object({
  name: z.string(),
  nameNepali: z.string().optional(),
  constituency: z.string(),
  province: z.string(),
  role: z.string().default("Member of Parliament"),
  photoUrl: z.string().url().optional(),
  externalId: z.string().optional(),
  sourceUrl: z.string().url().optional(),
})
export type ScrapedMember = z.infer<typeof ScrapedMemberSchema>

export const ScrapedBillSchema = z.object({
  title: z.string(),
  titleNepali: z.string().optional(),
  code: z.string().optional(),
  status: z.enum(["DRAFT", "PROPOSED", "COMMITTEE", "PASSED", "REJECTED", "ENACTED"]),
  category: z.string(),
  summary: z.string(),
  fullText: z.string().optional(),
  proposedDate: z.coerce.date().optional(),
  passedDate: z.coerce.date().optional(),
  enactedDate: z.coerce.date().optional(),
  sponsorName: z.string().optional(),
  externalId: z.string().optional(),
  sourceUrl: z.string().url().optional(),
})
export type ScrapedBill = z.infer<typeof ScrapedBillSchema>

export const ScrapedVoteSchema = z.object({
  date: z.coerce.date(),
  type: z.enum(["FINAL_PASSAGE", "AMENDMENT", "PROCEDURAL"]),
  outcome: z.enum(["PASSED", "DEFEATED"]),
  description: z.string().optional(),
  billExternalId: z.string().optional(),
  externalId: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  memberVotes: z.array(z.object({
    memberExternalId: z.string(),
    choice: z.enum(["YEA", "NAY", "ABSTAIN", "ABSENT"]),
  })).optional(),
})
export type ScrapedVote = z.infer<typeof ScrapedVoteSchema>

export const ScrapedNewsArticleSchema = z.object({
  title: z.string(),
  content: z.string(),
  date: z.coerce.date(),
  sourceUrl: z.string().url(),
  category: z.enum(["statement", "controversy", "appointment", "general"]).default("general"),
  relatedMemberName: z.string().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
})
export type ScrapedNewsArticle = z.infer<typeof ScrapedNewsArticleSchema>

// ─── Scraper interface ───────────────────────────────────────

export interface ScraperResult<T> {
  source: string
  jobName: string
  records: T[]
  rawHtml?: string
  errors: string[]
}

export interface Scraper<T> {
  name: string
  source: string
  run(): Promise<ScraperResult<T>>
}
