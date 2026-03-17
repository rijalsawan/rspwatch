"use client"

import { useState } from "react"
import { useCachedFetch } from "@/hooks/use-cached-fetch"
import { motion } from "framer-motion"
import { Briefcase, Calendar, CheckCircle2, Database, PenLine, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface Appointment {
  id: string
  title: string
  appointee: string
  position: string
  date: string
  description: string | null
  sourceUrl: string | null
  confidence: "VERIFIED" | "SCRAPED" | "MANUAL"
  category: "Cabinet" | "Committee" | "Structural"
  member: { id: string; slug: string; name: string } | null
}

// Confidence badge configuration
const CONFIDENCE_CONFIG = {
  VERIFIED: {
    label: "Verified",
    icon: CheckCircle2,
    className: "bg-success/10 text-success border-success/20",
  },
  SCRAPED: {
    label: "Auto-sourced",
    icon: Database,
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  MANUAL: {
    label: "Manual Entry",
    icon: PenLine,
    className: "bg-muted text-muted-foreground border-border",
  },
}

export default function AppointmentsPage() {
  const [filter, setFilter] = useState("All")

  const categories = ["All", "Cabinet", "Committee", "Structural"]

  // Use cached fetch
  const { data: appointmentsResponse, loading } = useCachedFetch<{data: Appointment[]}>("/api/appointments?limit=50")

  const appointments = appointmentsResponse?.data ?? []

  const filteredAppointments = filter === "All"
    ? appointments
    : appointments.filter((a) => a.category === filter)

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold tracking-tight text-foreground mb-4">
          Appointments & Cabinet
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Track Rastriya Swatantra Party (RSP) members serving in the cabinet, parliamentary committees, and key structural roles.
        </p>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
              filter === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted shrink-0" />
                  <div>
                    <div className="h-5 bg-muted rounded w-32 mb-2" />
                    <div className="h-4 bg-muted rounded-full w-20" />
                  </div>
                </div>
                <div className="h-4 bg-muted rounded-full w-16 shrink-0" />
              </div>

              <div className="mb-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>

              <div className="space-y-2 mb-6 flex-1">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-5/6" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                <div className="h-3 bg-muted rounded w-20" />
                <div className="h-6 bg-muted rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border border-dashed rounded-md">
          <h3 className="font-semibold text-lg">No appointments found</h3>
          <p className="text-muted-foreground mt-1">Try a different filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAppointments.map((apt, index) => {
            const confidenceConfig = CONFIDENCE_CONFIG[apt.confidence] || CONFIDENCE_CONFIG.MANUAL
            const ConfidenceIcon = confidenceConfig.icon

            return (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                      {apt.appointee.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground leading-tight">{apt.appointee}</h3>
                      <div className="flex items-center gap-1.5 text-xs font-medium mt-1.5">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full",
                            apt.category === "Cabinet" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                            apt.category === "Committee" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                            apt.category === "Structural" && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                          )}
                        >
                          {apt.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 flex-grow">
                  <div className="flex items-start gap-2 text-sm text-foreground">
                    <Briefcase className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                    <span className="font-medium line-clamp-2">{apt.position}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>
                      Since{" "}
                      {new Date(apt.date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                  {/* Verification Badge */}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border",
                      confidenceConfig.className
                    )}
                    title={`Data source: ${confidenceConfig.label}`}
                  >
                    <ConfidenceIcon className="w-3 h-3" />
                    {confidenceConfig.label}
                  </span>

                  <div className="flex items-center gap-3">
                    {apt.sourceUrl && (
                      <a
                        href={apt.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                        title="View source"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {apt.member && (
                      <a
                        href={`/members/${apt.member.slug}`}
                        className="text-xs font-medium text-primary hover:underline outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                      >
                        View Profile
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
