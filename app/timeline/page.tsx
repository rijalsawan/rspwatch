"use client"

import { PageTransition } from "@/components/animations/PageTransition"
import { StaggerList } from "@/components/animations/StaggerList"
import { ActivityFeedItem } from "@/components/shared/ActivityFeedItem"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

const TIMELINE_DATA = [
  {
    id: "tl-01",
    date: "March 15, 2026 - 10:00 AM",
    title: "Education Reform Bill Introduced to Parliament",
    description: "A sweeping bill aimed at overhauling public school administration and teacher accountability. The bill was presented by MP Shishir Khanal.",
    category: "Bill Proposed" as const,
    status: "pending" as const,
    href: "/laws/edu-reform-2026",
  },
  {
    id: "tl-02",
    date: "March 14, 2026 - 3:30 PM",
    title: "Fulfilled Promise: Digital Citizen Service Portal Launched",
    description: "The new portal allows citizens to apply for passports, vital records, and pay local taxes entirely online without visiting ward offices. The PM inaugurated the system at Singha Durbar.",
    category: "Promise Kept" as const,
    status: "kept" as const,
    href: "/promises/digital-portal",
  },
  {
    id: "tl-03",
    date: "March 12, 2026 - 5:15 PM",
    title: "Vote on Foreign Investment Moderation",
    description: "The party voted along party lines (182-0) to increase the minimum threshold for foreign direct investment in retail sectors.",
    category: "Floor Vote" as const,
    status: "neutral" as const,
    href: "/votes/fdi-retail",
  },
  {
    id: "tl-04",
    date: "March 10, 2026 - 2:00 PM",
    title: "Passed: Anti-Corruption & Assets Declaration Act, 2026",
    description: "Landmark legislation mandating 30-day asset declarations for all public officials passed with a majority of 215 votes in the House.",
    category: "Law Passed" as const,
    status: "passed" as const,
    href: "/laws/anti-corruption-act-2026",
  },
  {
    id: "tl-05",
    date: "March 08, 2026 - 11:30 AM",
    title: "Press Release: Response to Hydropower Procurement Delays",
    description: "The Ministry of Energy issued a strict 15-day ultimatum to contractors failing to meet their milestone deadlines regarding the Upper Karnali expansions.",
    category: "Statement" as const,
    status: "primary" as const,
    href: "#",
  },
  {
    id: "tl-06",
    date: "March 05, 2026 - 9:00 AM",
    title: "Committee Hearing: Healthcare Infrastructure Audit",
    description: "Dr. Toshima Karki initiated a rigorous audit probe into missing hospital equipment funds across 3 provinces.",
    category: "Committee" as const,
    status: "warning" as const,
    href: "#",
  },
  {
    id: "tl-07",
    date: "March 01, 2026 - 4:00 PM",
    title: "Startup & Innovation Tax Relief Bill Becomes Law",
    description: "Following presidential assent, the comprehensive startup tax relief packages officially enter active implementation.",
    category: "Law Enacted" as const,
    status: "passed" as const,
    href: "/laws/startup-tax-2026",
  },
]

export default function TimelinePage() {
  const categories = ["All Categories", "Bill Proposed", "Law Passed", "Floor Vote", "Promise Kept", "Statement", "Controversy"]

  return (
    <PageTransition className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-10 w-full">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
          Full Activity Timeline
        </h1>
        <p className="text-lg text-muted-foreground">
          A definitive, chronological feed of every action, vote, statement, and law 
          triggered by the governing party since taking office in March 2026.
        </p>
      </div>

      {/* Filter / Search specifically tailored for a single-column layout */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card border border-border rounded-md sticky top-[72px] z-10 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search timeline..." 
            className="pl-9 bg-background"
          />
        </div>
        <div className="relative inline-flex">
          <select className="h-10 w-full sm:w-auto appearance-none rounded-md border border-input bg-background pl-3 pr-10 py-2 text-sm ring-offset-background cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* The Timeline Canvas */}
      <div className="bg-card border border-border rounded-md p-6 sm:p-10">
        <StaggerList>
          {TIMELINE_DATA.map((item, index) => (
            <ActivityFeedItem 
              key={item.id}
              date={item.date}
              title={item.title}
              description={item.description}
              category={item.category}
              status={item.status}
              href={item.href}
              isLast={index === TIMELINE_DATA.length - 1} // Determines if we slice the line off
            />
          ))}
        </StaggerList>
        
        {/* Load More trigger (Visual only) */}
        <div className="pt-8 pb-4 flex justify-center border-t border-border mt-8">
          <span className="text-sm font-medium text-muted-foreground hover:text-primary cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-2 py-1">
            Load Older Events
          </span>
        </div>
      </div>
    </PageTransition>
  )
}
