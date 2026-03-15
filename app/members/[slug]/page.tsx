"use client"

import { PageTransition } from "@/components/animations/PageTransition"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, MapPin, Briefcase, FileText, CheckCircle2, History, X } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ActivityFeedItem } from "@/components/shared/ActivityFeedItem"

export default function MemberDetailPage() {
  const { slug } = useParams()
  const slugStr = typeof slug === 'string' ? slug : slug[0]

  // Extremely basic mock for exact parameters
  const isPM = slugStr.includes("balen")
  const isMinister = slugStr.includes("sumana") || slugStr.includes("rabi") || slugStr.includes("swarnim")
  const role = isPM ? "Prime Minister" : isMinister ? "Cabinet Minister" : "Member of Parliament"

  return (
    <PageTransition className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-10 w-full">
      
      {/* 1. Breadcrumbs */}
      <Link 
        href="/members" 
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors w-fit outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm mb-[-16px]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Directory
      </Link>

      {/* 2. Profile Header Hero */}
      <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6 md:gap-8 bg-card border border-border rounded-md p-6 md:p-10">
        <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-secondary border-4 border-background shadow-sm flex items-center justify-center shrink-0">
          <User className="w-16 h-16 md:w-20 md:h-20 text-muted-foreground" />
        </div>
        
        <div className="flex flex-col justify-center items-center md:items-start text-center md:text-left gap-3 flex-1">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h1 className="text-3xl md:text-5xl font-display font-bold">
                {slugStr.split('-').map(str => str.charAt(0).toUpperCase() + str.slice(1)).join(' ')}
              </h1>
              <StatusBadge status={isPM || isMinister ? "primary" : "neutral"} className="hidden md:inline-flex mt-1">
                {role}
              </StatusBadge>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-muted-foreground font-medium mt-2">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> Kathmandu-8
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" /> Took Office: Mar 2026
              </span>
            </div>
            {/* Mobile Badge */}
            <StatusBadge status={isPM || isMinister ? "primary" : "neutral"} className="md:hidden mt-2 self-center">
              {role}
            </StatusBadge>
          </div>

          <div className="flex gap-3 mt-4 w-full md:w-auto">
            <Button className="w-full md:w-auto">View Sponsored Bills</Button>
            <Button variant="outline" className="w-full md:w-auto gap-2 text-muted-foreground">
              Offcial Profile <User className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* LEFT COLUMN: Activity & Statements */}
        <div className="lg:col-span-8 flex flex-col gap-10">
          
          <section className="flex flex-col gap-6">
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              <History className="w-6 h-6 text-primary" />
              Recent Activity
            </h2>
            <div className="bg-card border border-border rounded-md p-6 sm:p-8">
              <ActivityFeedItem 
                date="March 10, 2026"
                title="Sponsored Anti-Corruption Act"
                description="Officially brought the landmark anti-corruption bill to the floor for final debate."
                category="Bill Sponsored"
                status="primary"
                href="/laws/anti-corruption-act-2026"
              />
              <ActivityFeedItem 
                date="Feb 25, 2026"
                title="Voted YEA on Startup Tax Relief"
                description="Voted alongside the party bloc."
                category="Floor Vote"
                status="success"
                href="/votes/vote-039"
              />
              <ActivityFeedItem 
                date="Feb 12, 2026"
                title="Appointed to Education Committee Chair"
                description="Assumed leadership of the parliamentary committee overseeing the new education reform targets."
                category="Role Update"
                status="neutral"
                href="#"
                isLast
              />
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: Roll Call & Stats Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          <div className="bg-card border border-border rounded-md p-6 flex flex-col gap-6 sticky top-[88px]">
            
            <div className="flex flex-col gap-2">
              <h3 className="font-display font-bold text-lg border-b border-border pb-2">Record Stats</h3>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Parliament Attendance</span>
                <span className="font-bold text-success">98%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Total Votes Cast</span>
                <span className="font-bold">42</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Party Loyalty Score</span>
                <span className="font-bold">100%</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Bills Sponsored</span>
                <span className="font-bold">3</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="font-display font-bold text-lg border-b border-border pb-2">Latest Key Votes</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-success/10 text-success p-1 rounded-sm shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold leading-tight">FDI Moderation Act</span>
                    <span className="text-xs text-muted-foreground">Voted YEA (Mar 12)</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-destructive/10 text-destructive p-1 rounded-sm shrink-0">
                    <X className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold leading-tight">Amendment 12: Data Limits</span>
                    <span className="text-xs text-muted-foreground">Voted NAY (Feb 28)</span>
                  </div>
                </div>
              </div>
              <Link href="/votes" className="text-sm font-medium text-primary hover:underline mt-2 inline-block">
                See all voting records
              </Link>
            </div>

          </div>

        </div>

      </div>
    </PageTransition>
  )
}
