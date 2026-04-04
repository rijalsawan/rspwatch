"use client"

import { useState, useMemo, useEffect } from "react"
import { useCachedFetch } from "@/hooks/use-cached-fetch"
import { PageTransition } from "@/components/animations/PageTransition"
import { StaggerList } from "@/components/animations/StaggerList"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Newspaper,
  Search,
  ExternalLink,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Shield,
  ArrowUpRight,
  User,
} from "lucide-react"

interface NewsItem {
  id: string
  title: string
  excerpt: string
  content: string | null
  sourceUrl: string
  sourceLabel: string
  sourceSlug: string
  date: string
  confidence: string
  member: { id: string; name: string; slug: string } | null
}

interface ApiMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

interface NewsResponse {
  data: NewsItem[]
  meta: ApiMeta
}

const SOURCE_TABS = [
  { value: "all", label: "All Sources" },
  { value: "kathmandu-post", label: "Kathmandu Post" },
  { value: "onlinekhabar", label: "Online Khabar" },
  { value: "rsp-official", label: "RSP Official" },
]

export default function PressPage() {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [source, setSource] = useState("all")
  const [page, setPage] = useState(1)
  const limit = 12

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setPage(1) }, [debouncedSearch, source])

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
    if (debouncedSearch) params.set("q", debouncedSearch)
    if (source !== "all") params.set("source", source)
    return `/api/news?${params}`
  }, [page, debouncedSearch, source])

  const { data: response, loading } = useCachedFetch<NewsResponse>(apiUrl)

  const items = response?.data ?? []
  const meta = response?.meta ?? null

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    })

  const totalPages = meta?.totalPages ?? 1

  return (
    <PageTransition className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-8 w-full">

      {/* Header */}
      <div className="flex flex-col gap-4 max-w-3xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <Newspaper className="w-6 h-6 text-primary" />
          </div>
          <span className="text-sm font-semibold tracking-wider uppercase text-primary">
            Media Coverage
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
          Press & News
        </h1>
        <p className="text-lg text-muted-foreground">
          RSP-related coverage from Nepali media outlets and official party communications, collected by automated scrapers.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 p-4 bg-card border border-border rounded-md">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search news..."
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {meta && (
            <span className="text-sm text-muted-foreground sm:ml-auto shrink-0">
              {meta.total} article{meta.total !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Source filter tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {SOURCE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSource(tab.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                source === tab.value
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* News Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-5 animate-pulse">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3.5 h-3.5 bg-muted rounded" />
                <div className="h-3 bg-muted rounded w-24" />
              </div>
              <div className="h-5 bg-muted rounded w-full mb-2" />
              <div className="h-5 bg-muted rounded w-3/4 mb-3" />
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <div className="h-3 bg-muted rounded w-28" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <a
              key={item.id}
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-card border border-border rounded-lg p-5 hover:border-primary/40 hover:shadow-md transition-all flex flex-col"
            >
              {/* Source badge + date */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-secondary text-secondary-foreground">
                  {item.sourceLabel}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <time dateTime={item.date}>{formatDate(item.date)}</time>
                </span>
              </div>

              {/* Title */}
              <h2 className="font-bold text-base text-foreground leading-snug line-clamp-3 group-hover:text-primary transition-colors mb-2">
                {stripHtml(item.title)}
              </h2>

              {/* Excerpt */}
              {item.excerpt && (
                <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                  {stripHtml(item.excerpt)}
                </p>
              )}

              {/* Footer */}
              <div className="mt-auto pt-3 border-t border-border flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {item.member && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                      <User className="w-3 h-3 shrink-0" />
                      {item.member.name}
                    </span>
                  )}
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      item.confidence === "VERIFIED"
                        ? "bg-success"
                        : item.confidence === "SCRAPED"
                          ? "bg-primary"
                          : "bg-muted-foreground"
                    }`}
                    title={item.confidence}
                  />
                </div>
                <span className="flex items-center gap-1 text-xs font-medium text-primary shrink-0">
                  Read <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </a>
          ))}
        </StaggerList>
      ) : (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-md">
          <Newspaper className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">No articles found</h3>
          <p className="text-muted-foreground mt-1">
            {search ? "Try adjusting your search or source filter." : "No published news yet. Scrapers will collect articles automatically."}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-4">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Shield className="w-3.5 h-3.5" />
        Collected from Kathmandu Post, Online Khabar & rspnepal.org
      </div>

    </PageTransition>
  )
}
