"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useCachedFetch } from "@/hooks/use-cached-fetch"
import { PageTransition } from "@/components/animations/PageTransition"
import { StatusBadge } from "@/components/shared/StatusBadge"
import type { StatusType } from "@/components/shared/StatusBadge"
import { PublicSentimentPoll } from "@/components/shared/PublicSentimentPoll"
import { useAuthModal } from "@/components/global/AuthModal"
import {
  ArrowLeft, Calendar, ExternalLink, UserCircle2,
  MessageSquare, Send, Loader2, Gavel, AlertTriangle,
  Trash2, Reply, CornerDownRight,
} from "lucide-react"
import Link from "next/link"

// ─── Types ────────────────────────────────────────────────────

interface ReplyData {
  id: string
  content: string
  createdAt: string
  user: { id: string; name: string | null }
}

interface CommentData {
  id: string
  content: string
  createdAt: string
  user: { id: string; name: string | null }
  replies: ReplyData[]
}

interface DiscussionDetail {
  type: "LAW" | "CONTROVERSY"
  id: string
  slug: string
  title: string
  titleNepali: string | null
  description: string
  fullText: string | null
  category: string
  status: string
  date: string
  sourceUrl: string | null
  member: { id: string; slug: string; name: string } | null
  tags: { id: string; name: string }[]
  comments: CommentData[]
  commentCount: number
}

// ─── Page ─────────────────────────────────────────────────────

export default function DiscussionDetailPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const { data: res, loading } = useCachedFetch<{ data: DiscussionDetail }>(
    `/api/discussions/${slug}`
  )

  const topic = res?.data ?? null
  const [comments, setComments] = useState<CommentData[]>([])
  const [commentCount, setCommentCount] = useState(0)

  // Initialize comments from API response
  useEffect(() => {
    if (topic) {
      setComments(topic.comments)
      setCommentCount(topic.commentCount)
    }
  }, [topic])

  const addComment = (newComment: CommentData) => {
    setComments((prev) => [newComment, ...prev])
    setCommentCount((prev) => prev + 1)
  }

  const addReply = (parentId: string, newReply: ReplyData) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === parentId ? { ...c, replies: [...c.replies, newReply] } : c
      )
    )
    setCommentCount((prev) => prev + 1)
  }

  const removeComment = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    setCommentCount((prev) => Math.max(0, prev - 1))
  }

  const removeReply = (parentId: string, replyId: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === parentId
          ? { ...c, replies: c.replies.filter((r) => r.id !== replyId) }
          : c
      )
    )
    setCommentCount((prev) => Math.max(0, prev - 1))
  }

  if (loading) return <LoadingSkeleton />

  if (!topic) {
    return (
      <PageTransition className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16">
        <Link
          href="/discussions"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to discussions
        </Link>
        <div className="bg-card border border-border rounded-md p-12 text-center">
          <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Discussion Not Found</h2>
          <p className="text-muted-foreground">This topic may have been removed or the URL is incorrect.</p>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16 flex flex-col gap-10">
      {/* Back */}
      <Link
        href="/discussions"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" /> Back to discussions
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

        {/* ── Left: Content ──────────────────────────── */}
        <div className="lg:col-span-8 flex flex-col gap-8">

          {/* Header */}
          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={topic.type === "LAW" ? "primary" : "warning"}>
                {topic.type === "LAW"
                  ? <span className="flex items-center gap-1"><Gavel className="w-3 h-3" /> Bill</span>
                  : <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Controversy</span>
                }
              </StatusBadge>
              <StatusBadge status={statusToDisplay(topic.status)}>{topic.status}</StatusBadge>
              <StatusBadge status="neutral">{topic.category}</StatusBadge>
            </div>

            <h1 className="text-3xl md:text-4xl font-display font-bold leading-tight tracking-tight text-foreground">
              {topic.title}
            </h1>
            {topic.titleNepali && (
              <p className="text-lg text-muted-foreground">{topic.titleNepali}</p>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(topic.date).toLocaleDateString("en-US", {
                  month: "long", day: "numeric", year: "numeric",
                })}
              </span>
              {topic.member && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <Link
                    href={`/members/${topic.member.slug}`}
                    className="flex items-center gap-1.5 hover:text-primary transition-colors"
                  >
                    <UserCircle2 className="w-3.5 h-3.5" />
                    {topic.member.name}
                  </Link>
                </>
              )}
              {topic.sourceUrl && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <a
                    href={topic.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Source
                  </a>
                </>
              )}
            </div>

            {topic.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {topic.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2.5 py-0.5 text-xs font-medium rounded-sm bg-muted text-muted-foreground border border-border"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Body */}
          <section className="bg-card border border-border rounded-md p-6 lg:p-8">
            <p className="text-base leading-relaxed whitespace-pre-line">{topic.description}</p>
            {topic.fullText && (
              <>
                <hr className="my-6 border-border" />
                <h3 className="text-lg font-display font-bold mb-3">Full Text</h3>
                <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                  {topic.fullText}
                </p>
              </>
            )}
          </section>

          {/* Comments */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                Discussion
                <span className="text-base font-normal text-muted-foreground">({commentCount})</span>
              </h2>
            </div>

            <CommentBox slug={slug} onPosted={addComment} />

            {comments.length > 0 ? (
              <div className="flex flex-col gap-4">
                {comments.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    slug={slug}
                    onReplyPosted={(reply) => addReply(comment.id, reply)}
                    onDeleted={() => removeComment(comment.id)}
                    onReplyDeleted={(replyId) => removeReply(comment.id, replyId)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-md p-8 text-center">
                <p className="text-muted-foreground text-sm">
                  No comments yet. Be the first to share your thoughts.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* ── Right: Sidebar ─────────────────────────── */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <PublicSentimentPoll entityId={topic.id} entityType={topic.type} />

          <div className="bg-card border border-border p-6 rounded-md flex flex-col gap-4">
            <h3 className="font-display font-bold text-lg">About This Topic</h3>
            <ul className="flex flex-col gap-3 text-sm">
              <li className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{topic.type === "LAW" ? "Law / Bill" : "Controversy"}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{topic.status}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium">{topic.category}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Comments</span>
                <span className="font-medium tabular-nums">{commentCount}</span>
              </li>
              {topic.member && (
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Related MP</span>
                  <Link href={`/members/${topic.member.slug}`} className="font-medium text-primary hover:underline">
                    {topic.member.name}
                  </Link>
                </li>
              )}
            </ul>
          </div>

          <Link
            href="/discussions"
            className="flex items-center justify-center gap-2 w-full text-sm font-medium px-4 py-2.5 rounded-md border border-border bg-card hover:border-primary/50 hover:bg-secondary/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> All Discussions
          </Link>
        </div>
      </div>
    </PageTransition>
  )
}

// ─── Comment Box (new top-level comment) ──────────────────────

function CommentBox({ slug, onPosted }: { slug: string; onPosted: (comment: CommentData) => void }) {
  const { data: session } = useSession()
  const { openAuthModal } = useAuthModal()
  const [content, setContent] = useState("")
  const [posting, setPosting] = useState(false)
  const [err, setErr] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) { openAuthModal(); return }
    const trimmed = content.trim()
    if (trimmed.length < 2) { setErr("Comment is too short."); return }

    setPosting(true)
    setErr("")
    const res = await fetch(`/api/discussions/${slug}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed }),
    })
    setPosting(false)

    if (res.ok) {
      const data = await res.json()
      const newComment: CommentData = {
        id: data.data.id,
        content: data.data.content,
        createdAt: data.data.createdAt,
        user: data.data.user,
        replies: [],
      }
      setContent("")
      onPosted(newComment)
    } else {
      const data = await res.json().catch(() => null)
      setErr(data?.error ?? "Failed to post comment.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-md p-5 flex flex-col gap-3">
      <textarea
        placeholder={session ? "Share your thoughts..." : "Sign in to comment..."}
        value={content}
        onChange={(e) => { setContent(e.target.value); if (err) setErr("") }}
        onClick={() => { if (!session) openAuthModal() }}
        rows={3}
        maxLength={2000}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors resize-none"
      />
      {err && <p className="text-xs text-destructive">{err}</p>}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{content.length}/2000</span>
        <button
          type="submit"
          disabled={posting || content.trim().length < 2}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {posting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Posting...</> : <><Send className="w-3.5 h-3.5" /> Comment</>}
        </button>
      </div>
    </form>
  )
}

// ─── Comment Card ─────────────────────────────────────────────

function CommentCard({
  comment, slug, onReplyPosted, onDeleted, onReplyDeleted,
}: {
  comment: CommentData; slug: string; onReplyPosted: (reply: ReplyData) => void; onDeleted: () => void; onReplyDeleted: (replyId: string) => void
}) {
  const { data: session } = useSession()
  const { openAuthModal } = useAuthModal()
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteErr, setDeleteErr] = useState("")

  const isOwner = !!session?.user?.id && session.user.id === comment.user.id

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteErr("")
    const res = await fetch(`/api/discussions/${slug}/comments/${comment.id}`, { method: "DELETE" })
    setDeleting(false)
    if (res.ok) { onDeleted() } else {
      const data = await res.json().catch(() => null)
      setDeleteErr(data?.error ?? "Failed to delete.")
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Comment */}
      <div className="bg-card border border-border rounded-md p-5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground flex items-center gap-1.5">
            <UserCircle2 className="w-4 h-4 text-muted-foreground" />
            {comment.user.name ?? "Anonymous"}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {new Date(comment.createdAt).toLocaleDateString("en-US", {
                month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
              })}
            </span>
            <button
              onClick={() => { if (!session) { openAuthModal(); return } setShowReplyBox((v) => !v) }}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
            >
              <Reply className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reply</span>
            </button>
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                title="Delete comment"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{comment.content}</p>
        {deleteErr && <p className="text-xs text-destructive">{deleteErr}</p>}
      </div>

      {/* Inline reply box */}
      {showReplyBox && (
        <div className="ml-6 border-l-2 border-border pl-4">
          <ReplyBox
            slug={slug}
            parentId={comment.id}
            parentUsername={comment.user.name ?? "Anonymous"}
            onPosted={(reply) => { setShowReplyBox(false); onReplyPosted(reply) }}
            onCancel={() => setShowReplyBox(false)}
          />
        </div>
      )}

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="ml-6 border-l-2 border-border pl-4 flex flex-col gap-2">
          {comment.replies.map((reply) => (
            <ReplyCard key={reply.id} reply={reply} slug={slug} onDeleted={() => onReplyDeleted(reply.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Reply Card ───────────────────────────────────────────────

function ReplyCard({
  reply, slug, onDeleted,
}: {
  reply: ReplyData; slug: string; onDeleted: () => void
}) {
  const { data: session } = useSession()
  const [deleting, setDeleting] = useState(false)
  const isOwner = !!session?.user?.id && session.user.id === reply.user.id

  const handleDelete = async () => {
    setDeleting(true)
    const res = await fetch(`/api/discussions/${slug}/comments/${reply.id}`, { method: "DELETE" })
    setDeleting(false)
    if (res.ok) onDeleted()
  }

  return (
    <div className="bg-card border border-border rounded-md p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground flex items-center gap-1.5">
          <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground" />
          {reply.user.name ?? "Anonymous"}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {new Date(reply.createdAt).toLocaleDateString("en-US", {
              month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
            })}
          </span>
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 outline-none"
              title="Delete reply"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{reply.content}</p>
    </div>
  )
}

// ─── Reply Box ────────────────────────────────────────────────

function ReplyBox({
  slug, parentId, parentUsername, onPosted, onCancel,
}: {
  slug: string; parentId: string; parentUsername: string
  onPosted: (reply: ReplyData) => void; onCancel: () => void
}) {
  const [content, setContent] = useState(`@${parentUsername} `)
  const [posting, setPosting] = useState(false)
  const [err, setErr] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = content.trim()
    if (trimmed.length < 2) { setErr("Reply is too short."); return }

    setPosting(true)
    setErr("")
    const res = await fetch(`/api/discussions/${slug}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed, parentId }),
    })
    setPosting(false)

    if (res.ok) {
      const data = await res.json()
      const newReply: ReplyData = {
        id: data.data.id,
        content: data.data.content,
        createdAt: data.data.createdAt,
        user: data.data.user,
      }
      onPosted(newReply)
    } else {
      const data = await res.json().catch(() => null)
      setErr(data?.error ?? "Failed to post reply.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-md p-4 flex flex-col gap-3">
      <textarea
        value={content}
        onChange={(e) => { setContent(e.target.value); if (err) setErr("") }}
        rows={2}
        maxLength={2000}
        autoFocus
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors resize-none"
      />
      {err && <p className="text-xs text-destructive">{err}</p>}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{content.length}/2000</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={posting || content.trim().length < 2}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {posting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Posting...</> : <><Send className="w-3.5 h-3.5" /> Reply</>}
          </button>
        </div>
      </div>
    </form>
  )
}

// ─── Helpers ──────────────────────────────────────────────────

function statusToDisplay(status?: string): StatusType {
  if (!status) return "neutral"
  const map: Record<string, StatusType> = {
    PASSED: "passed", ENACTED: "passed", PROPOSED: "pending",
    COMMITTEE: "pending", DRAFT: "pending", REJECTED: "rejected",
    LOW: "neutral", MEDIUM: "warning", HIGH: "warning", CRITICAL: "destructive",
  }
  return map[status] ?? "neutral"
}

function LoadingSkeleton() {
  return (
    <PageTransition className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16 flex flex-col gap-10">
      <div className="h-4 w-36 bg-muted rounded animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="flex flex-col gap-4 animate-pulse">
            <div className="flex gap-2"><div className="h-5 w-14 bg-muted rounded-sm" /><div className="h-5 w-20 bg-muted rounded-sm" /></div>
            <div className="h-10 bg-muted rounded w-3/4" />
            <div className="h-5 bg-muted rounded w-1/2" />
          </div>
          <div className="bg-card border border-border rounded-md p-6 lg:p-8 animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </div>
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-card border border-border rounded-md p-6 animate-pulse h-36" />
          <div className="bg-card border border-border rounded-md p-6 animate-pulse h-48" />
        </div>
      </div>
    </PageTransition>
  )
}
