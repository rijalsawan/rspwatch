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
  Tag,
  ImageOff,
} from "lucide-react"

interface NewsItem {
  id: string
  slug: string
  title: string
  titleNp: string
  excerpt: string
  coverImage: string | null
  tags: string[]
  sourceUrl: string
  date: string
}

interface ApiMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}



// Utility function to strip HTML tags and decode entities
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&') // Replace &amp; with &
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#39;/g, "'") // Replace &#39; with '
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim() // Remove leading/trailing whitespace
}

interface NewsResponse {
  data: NewsItem[]
  meta: ApiMeta
}

export default function PressPage() {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [page, setPage] = useState(1)
  const limit = 12

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  // Reset to page 1 on search/category change
  useEffect(() => { setPage(1) }, [debouncedSearch, category])

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
    if (debouncedSearch) params.set("q", debouncedSearch)
    if (category !== "all") params.set("category", category)
    return `/api/news?${params}`
  }, [page, debouncedSearch, category])

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
            Official Communications
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
          Press & News
        </h1>
        <p className="text-lg text-muted-foreground">
          Official press releases, announcements, and news from RSP leadership. Live-synced from rspnepal.org.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-card border border-border rounded-md">
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

      {/* News Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg overflow-hidden animate-pulse">
              {/* Cover image placeholder */}
              <div className="relative h-48 bg-muted">
                {/* Tags placeholder */}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <div className="h-5 w-12 bg-background/90 border border-border/50 rounded-full" />
                </div>
              </div>

              {/* Content placeholder */}
              <div className="p-5 flex flex-col gap-2.5">
                {/* Date placeholder */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3.5 h-3.5 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-24" />
                </div>

                {/* Title placeholders */}
                <div className="h-5 bg-muted rounded w-full mb-2" />
                <div className="h-4 bg-muted rounded w-3/4 mb-3" />

                {/* Summary placeholder */}
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
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
              className="group bg-card border border-border rounded-lg overflow-hidden hover:border-primary/40 hover:shadow-md transition-all flex flex-col"
            >
              {/* Cover image */}
              <div className="relative h-48 bg-muted overflow-hidden shrink-0">
                {item.coverImage ? (
                  <img
                    src={item.coverImage}
                    alt={item.titleNp || item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                      const fallback = e.currentTarget.parentElement?.querySelector(".img-fallback")
                      if (fallback) (fallback as HTMLElement).style.display = "flex"
                    }}
                  />
                ) : null}
                <div
                  className="img-fallback absolute inset-0 items-center justify-center bg-muted"
                  style={{ display: item.coverImage ? "none" : "flex" }}
                >
                  <ImageOff className="w-8 h-8 text-muted-foreground/40" />
                </div>

                {item.tags.length > 0 && (
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {item.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs font-medium rounded-full bg-background/90 backdrop-blur-sm text-foreground border border-border/50 capitalize"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col gap-2.5 flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <time dateTime={item.date}>{formatDate(item.date)}</time>
                </div>

                {/* Nepali title — primary, as shown on rspnepal.org */}
                {item.titleNp && (
                  <h2 className="font-bold text-base text-foreground leading-snug line-clamp-3 group-hover:text-primary transition-colors">
                    {stripHtml(item.titleNp)}
                  </h2>
                )}

                {/* English title — only show if meaningfully different */}
                {item.title && item.title !== item.titleNp && !item.title.match(/^(news|press)/i) && (
                  <p className="text-xs text-muted-foreground line-clamp-1 italic">
                    {stripHtml(item.title)}
                  </p>
                )}

                {/* Excerpt */}
                {item.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2 flex-1 mt-0.5">
                    {stripHtml(item.excerpt)}
                  </p>
                )}

                <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">rspnepal.org</span>
                  <span className="flex items-center gap-1 text-xs font-medium text-primary">
                    Read <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </a>
          ))}
        </StaggerList>
      ) : (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-md">
          <Newspaper className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">No articles found</h3>
          <p className="text-muted-foreground mt-1">
            {search ? "Try adjusting your search." : "No published news yet."}
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
        <Tag className="w-3.5 h-3.5" />
        Live-synced from{" "}
        <a href="https://rspnepal.org/news" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          rspnepal.org/news
        </a>
      </div>

    </PageTransition>
  )
}
