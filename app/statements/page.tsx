"use client"

import { useState } from "react"
import { useCachedFetch } from "@/hooks/use-cached-fetch"
import { PageTransition } from "@/components/animations/PageTransition"
import { Quote, Search, ExternalLink, Calendar, User } from "lucide-react"
import Link from "next/link"

interface Statement {
  id: string
  title: string
  content: string | null
  date: string
  sourceUrl: string | null
  member: { id: string; slug: string; name: string } | null
}

export default function StatementsPage() {
  const [search, setSearch] = useState("")

  // Use cached fetch
  const { data: statementsResponse, loading } = useCachedFetch<{data: Statement[]}>("/api/statements?limit=50")

  const statements = statementsResponse?.data ?? []

  const filteredStatements = statements.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.title.toLowerCase().includes(q) ||
      (s.content?.toLowerCase().includes(q) ?? false) ||
      (s.member?.name.toLowerCase().includes(q) ?? false)
    )
  })

  return (
    <PageTransition className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-8 w-full">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl md:text-5xl font-display font-bold">Public Statements</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Track official press releases, speeches, and public statements made by RSP members or the party leadership.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-card border border-border p-4 rounded-md shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by keyword, topic, or member..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-md text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-6 animate-pulse">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div className="h-6 bg-muted rounded w-3/4 max-w-md" />
                <div className="h-6 bg-muted rounded-full w-32 shrink-0" />
              </div>

              <div className="mb-4">
                <div className="h-5 bg-muted rounded-full w-40 mb-3" />
              </div>

              <div className="space-y-2 mb-4">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-8 bg-muted rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredStatements.length > 0 ? (
            filteredStatements.map((statement) => (
              <div key={statement.id} className="bg-card border border-border rounded-lg p-6 relative group overflow-hidden hover:border-primary/30 transition-colors">
                <Quote className="absolute -top-4 -right-4 w-24 h-24 text-muted/30 -z-10 group-hover:text-primary/5 transition-colors" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <h2 className="text-xl font-bold font-display z-10">{statement.title}</h2>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground bg-background py-1.5 px-3 rounded-full border border-border/50 shrink-0">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(statement.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  {statement.member ? (
                    <Link
                      href={`/members/${statement.member.slug}`}
                      className="flex items-center gap-2 text-sm font-medium text-primary hover:underline bg-primary/5 py-1 px-3 rounded-full w-fit"
                    >
                      <User className="w-4 h-4" />
                      {statement.member.name}
                    </Link>
                  ) : (
                    <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted py-1 px-3 rounded-full w-fit">
                      <User className="w-4 h-4" />
                      Official Party Statement
                    </span>
                  )}
                </div>

                <p className="text-foreground/80 leading-relaxed z-10 relative">{statement.content}</p>

                {statement.sourceUrl && (
                  <div className="mt-5 pt-4 border-t border-border flex justify-end">
                    <a
                      href={statement.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary flex items-center gap-1 hover:underline"
                    >
                      View original source <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-card border border-border border-dashed rounded-md">
              <h3 className="font-semibold text-lg">No statements found</h3>
              <p className="text-muted-foreground mt-1">Try adjusting your search terms.</p>
            </div>
          )}
        </div>
      )}
    </PageTransition>
  )
}
