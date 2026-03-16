"use client"

import { useEffect, useState } from "react"
import { PageTransition } from "@/components/animations/PageTransition"
import { StaggerList } from "@/components/animations/StaggerList"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Clock,
  ExternalLink,
  CalendarDays,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react"

interface EventData {
  id: string
  title: string
  titleNp: string | null
  slug: string
  type: string
  summary: string | null
  summaryNp: string | null
  date: string
  image: string | null
  sourceUrl: string | null
  isCompleted: boolean
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventData[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [showUpcoming, setShowUpcoming] = useState(false)
  const limit = 12

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        })
        if (showUpcoming) params.set("upcoming", "true")

        const res = await fetch(`/api/events?${params}`)
        const json = await res.json()
        if (json.data) {
          setEvents(json.data)
          setTotal(json.meta?.total ?? 0)
        }
      } catch (e) {
        console.error("Failed to load events:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [page, showUpcoming])

  const totalPages = Math.ceil(total / limit)

  // Group events by month/year
  const groupedEvents = events.reduce<Record<string, EventData[]>>((acc, event) => {
    const date = new Date(event.date)
    const key = date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    if (!acc[key]) acc[key] = []
    acc[key].push(event)
    return acc
  }, {})

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return {
      day: date.getDate(),
      weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
      month: date.toLocaleDateString("en-US", { month: "short" }),
      time: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    }
  }

  return (
    <PageTransition className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-8 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <CalendarDays className="w-6 h-6 text-primary" />
            </div>
            <span className="text-sm font-semibold tracking-wider uppercase text-primary flex items-center gap-2">
              Party Activities
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
            Events & Gatherings
          </h1>
          <p className="text-lg text-muted-foreground">
            Official RSP party events synced live from rspnepal.org.
            {total > 0 && <span className="font-medium text-foreground"> {total} events</span>}
          </p>
        </div>

        {/* Filter toggle */}
        <div className="flex gap-2">
          <Button
            variant={!showUpcoming ? "default" : "outline"}
            size="sm"
            onClick={() => { setShowUpcoming(false); setPage(1) }}
          >
            <CalendarCheck className="w-4 h-4 mr-1.5" />
            All Events
          </Button>
          <Button
            variant={showUpcoming ? "default" : "outline"}
            size="sm"
            onClick={() => { setShowUpcoming(true); setPage(1) }}
          >
            <Calendar className="w-4 h-4 mr-1.5" />
            Upcoming
          </Button>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex flex-col gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-muted rounded-md" />
                <div className="flex-1">
                  <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="flex flex-col gap-8">
          {Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
            <div key={monthYear}>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                {monthYear}
              </h2>
              <StaggerList className="flex flex-col gap-4">
                {monthEvents.map((event) => {
                  const dateInfo = formatEventDate(event.date)

                  return (
                    <div
                      key={event.id}
                      className={`bg-card border rounded-lg overflow-hidden transition-colors group ${
                        event.isCompleted ? "border-border/50" : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="flex">
                        {/* Event image */}
                        {event.image && (
                          <div className="hidden md:block w-48 shrink-0 bg-muted overflow-hidden">
                            <img
                              src={event.image}
                              alt={event.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          </div>
                        )}

                        <div className="flex gap-4 p-5 flex-1 min-w-0">
                          {/* Date badge */}
                          <div className={`flex flex-col items-center justify-center min-w-[60px] p-3 rounded-md ${
                            event.isCompleted ? "bg-muted" : "bg-primary/10"
                          }`}>
                            <span className={`text-xs font-medium ${event.isCompleted ? "text-muted-foreground" : "text-primary"}`}>
                              {dateInfo.weekday}
                            </span>
                            <span className={`text-2xl font-bold ${event.isCompleted ? "text-muted-foreground" : "text-primary"}`}>
                              {dateInfo.day}
                            </span>
                            <span className={`text-xs font-medium ${event.isCompleted ? "text-muted-foreground" : "text-primary"}`}>
                              {dateInfo.month}
                            </span>
                          </div>

                          {/* Event details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="font-semibold text-foreground line-clamp-2">
                                  {event.title}
                                </h3>
                                {event.titleNp && event.titleNp !== event.title && (
                                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                                    {event.titleNp}
                                  </p>
                                )}
                              </div>
                              <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                event.isCompleted
                                  ? "bg-success/10 text-success"
                                  : "bg-primary/10 text-primary"
                              }`}>
                                {event.isCompleted && <CheckCircle2 className="w-3 h-3" />}
                                {event.type}
                              </span>
                            </div>

                            {event.summary && (
                              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                {event.summary}
                              </p>
                            )}

                            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {dateInfo.time}
                              </span>
                              {event.sourceUrl && (
                                <a
                                  href={event.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-primary hover:underline ml-auto"
                                >
                                  View on RSP
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </StaggerList>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card border border-border border-dashed rounded-md">
          <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">No events found</h3>
          <p className="text-muted-foreground mt-1">
            {showUpcoming ? "No upcoming events scheduled." : "Events will appear here once added."}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Source attribution */}
      <div className="flex justify-center">
        <a
          href="https://rspnepal.org/events"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          Live-synced from rspnepal.org
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </PageTransition>
  )
}
