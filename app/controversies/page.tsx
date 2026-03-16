"use client"

import { useState, useEffect } from "react"
import { PageTransition } from "@/components/animations/PageTransition"
import { Search, AlertTriangle, ShieldAlert, AlertCircle, Info, Calendar, User } from "lucide-react"
import Link from "next/link"

interface Controversy {
  id: string
  title: string
  description: string
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  date: string
  isResolved: boolean
  sourceUrl: string | null
  member: { id: string; slug: string; name: string } | null
}

function getSeverityDetails(severity: string) {
  switch (severity) {
    case "CRITICAL": return { icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" }
    case "HIGH": return { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" }
    case "MEDIUM": return { icon: AlertCircle, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" }
    default: return { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" }
  }
}

export default function ControversiesPage() {
  const [search, setSearch] = useState("")
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL")
  const [controversies, setControversies] = useState<Controversy[]>([])
  const [loading, setLoading] = useState(true)

  // Re-fetch when severity filter changes
  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ limit: "50" })
    if (filterSeverity !== "ALL") params.set("severity", filterSeverity)
    fetch(`/api/controversies?${params}`)
      .then((r) => r.json())
      .then((json) => { if (json.data) setControversies(json.data as Controversy[]) })
      .finally(() => setLoading(false))
  }, [filterSeverity])

  const filtered = controversies.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      (c.member?.name.toLowerCase().includes(q) ?? false)
    )
  })

  return (
    <PageTransition className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-8 w-full">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl md:text-5xl font-display font-bold flex items-center gap-3">
          <AlertTriangle className="w-10 h-10 text-destructive" /> Accountability Tracker
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Radical transparency means tracking our own flaws. This page monitors documented controversies, ethics violations, or disputes involving RSP members.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-card border border-border p-4 rounded-md shadow-sm">
        <div className="relative w-full md:w-96 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by issue or member..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-md text-sm outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((level) => (
            <button
              key={level}
              onClick={() => setFilterSeverity(level)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterSeverity === level
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-6 h-52 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.length > 0 ? (
            filtered.map((controversy) => {
              const style = getSeverityDetails(controversy.severity)
              const Icon = style.icon
              return (
                <div key={controversy.id} className={`bg-card border ${style.border} rounded-lg p-6 relative flex flex-col h-full`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`flex items-center gap-2 ${style.color} ${style.bg} px-3 py-1 rounded-full w-fit mb-3`}>
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-bold tracking-wider">{controversy.severity}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {controversy.isResolved ? (
                        <span className="text-xs font-medium px-2 py-1 bg-success/10 text-success rounded-md border border-success/20">Resolved</span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-1 bg-warning/10 text-warning rounded-md border border-warning/20">Active Issue</span>
                      )}
                    </div>
                  </div>

                  <h2 className="text-xl font-bold font-display mb-3">{controversy.title}</h2>
                  <p className="text-foreground/80 text-sm leading-relaxed flex-grow">{controversy.description}</p>

                  <div className="mt-6 pt-4 border-t border-border flex justify-between items-center text-sm">
                    {controversy.member ? (
                      <Link href={`/members/${controversy.member.slug}`} className="flex items-center gap-1.5 text-primary hover:underline font-medium">
                        <User className="w-4 h-4" /> {controversy.member.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground italic">Party-wide</span>
                    )}
                    <span className="flex items-center gap-1 text-muted-foreground bg-muted px-2 py-1 rounded-sm text-xs">
                      <Calendar className="w-3.5 h-3.5" /> {new Date(controversy.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="col-span-full text-center py-20 bg-card border border-border border-dashed rounded-md">
              <h3 className="font-semibold text-lg">No records found</h3>
              <p className="text-muted-foreground mt-1">Change your filters to see more results.</p>
            </div>
          )}
        </div>
      )}
    </PageTransition>
  )
}
