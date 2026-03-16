import type {
  LawStatus,
  PromiseStatus,
  VoteChoice,
  VoteType,
  VoteOutcome,
  ActivityType,
  DataConfidence,
  SeverityLevel,
  PromiseSource,
} from "@prisma/client"

// ─── Shared API response envelope ────────────────────────────

export interface ApiResponse<T> {
  data: T
  meta?: PaginationMeta | CursorMeta | Record<string, unknown>
  error?: string
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface CursorMeta {
  hasMore: boolean
  nextCursor: string | null
}

// ─── Domain DTOs ─────────────────────────────────────────────

export interface MemberListItem {
  id: string
  slug: string
  name: string
  photoUrl: string | null
  constituency: string
  province: string
  role: string
  isActive: boolean
  attendancePercent: number | null
}

export interface MemberDetail extends MemberListItem {
  nameNepali: string | null
  proposedLaws: LawListItem[]
  voteHistory: VoteWithChoice[]
  statements: StatementItem[]
}

export interface LawListItem {
  id: string
  slug: string
  title: string
  code: string | null
  status: LawStatus
  category: string
  summary: string
  proposedDate: string | null
  passedDate: string | null
  proposedBy: { id: string; slug: string; name: string } | null
  tags: { id: string; name: string }[]
}

export interface LawDetail extends LawListItem {
  titleNepali: string | null
  fullText: string | null
  sourceUrl: string | null
  enactedDate: string | null
  confidence: DataConfidence
  votes: VoteListItem[]
  relatedStatements: StatementItem[]
}

export interface VoteListItem {
  id: string
  date: string
  type: VoteType
  outcome: VoteOutcome
  description: string | null
  law: { id: string; slug: string; title: string; code: string | null } | null
  breakdown: VoteBreakdown
}

export interface VoteBreakdown {
  yea: number
  nay: number
  abstain: number
  absent: number
}

export interface VoteDetail extends VoteListItem {
  sourceUrl: string | null
  memberVotes: { memberId: string; memberName: string; memberSlug: string; choice: VoteChoice }[]
}

export interface VoteWithChoice {
  voteId: string
  date: string
  description: string | null
  lawTitle: string | null
  choice: VoteChoice
}

export interface PromiseListItem {
  id: string
  slug: string
  title: string
  description: string
  category: string
  status: PromiseStatus
  source: PromiseSource
  evidenceUrl: string | null
  lastUpdated: string
}

export interface StatementItem {
  id: string
  title: string
  content: string
  date: string
  sourceUrl: string | null
  member: { id: string; slug: string; name: string } | null
}

export interface ActivityFeedItem {
  id: string
  type: ActivityType
  title: string
  summary: string | null
  date: string
  entityId: string
  entitySlug: string | null
  relatedMember: { id: string; slug: string; name: string } | null
}

export interface DashboardStats {
  lawsPassed: number
  promisesTracked: number
  promisesKept: number
  daysInPower: number
  activeMps: number
  totalVotes: number
  promisesByStatus: Record<PromiseStatus, number>
}

export interface ScrapeLogItem {
  id: string
  jobName: string
  sourceUrl: string | null
  status: string
  recordsFound: number
  recordsCreated: number
  recordsUpdated: number
  errorMessage: string | null
  durationMs: number | null
  ranAt: string
}
