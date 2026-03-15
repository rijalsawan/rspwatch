import { PageTransition } from "@/components/animations/PageTransition"
import { StatCard } from "@/components/shared/StatCard"
import { ActivityFeedItem } from "@/components/shared/ActivityFeedItem"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { StaggerList } from "@/components/animations/StaggerList"
import { ArrowRight, BookOpen, CheckCircle2, Users, FileText } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <PageTransition className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16 flex flex-col gap-12">
      {/* Hero Section */}
      <section className="flex flex-col gap-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <StatusBadge status="primary" pulse>Live Tracker Active</StatusBadge>
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Day 142 in Power</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight tracking-tight text-foreground">
          Holding Power Accountable Through Data.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
          Public, un-editorialized tracking of the Rastriya Swatantra Party's 
          governance, promises, legislative actions, and parliamentary votes.
        </p>
      </section>

      {/* Live Stats Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Laws Passed" value="14" trend={{ value: "2 this month", positive: true }} />
        <StatCard label="Promises Tracked" value="68" />
        <StatCard label="Promises Kept" value="22" trend={{ value: "32% completion", positive: true }} />
        <StatCard label="Active MPs" value="182" />
      </section>

      {/* Main Grid Floor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Col: Main Content (Feed + Featured) */}
        <div className="lg:col-span-8 flex flex-col gap-10">
          
          {/* Featured Law */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold">Featured Law of the Week</h2>
              <Link href="/laws/anti-corruption-act-2026" className="text-sm font-medium text-primary hover:underline underline-offset-4 flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="bg-card border border-border rounded-md p-6 lg:p-8 hover:border-primary/50 transition-colors group">
              <div className="flex flex-wrap gap-2 mb-4">
                <StatusBadge status="passed">Passed</StatusBadge>
                <StatusBadge status="neutral">Anti-Corruption</StatusBadge>
              </div>
              <h3 className="text-2xl font-semibold mb-3 group-hover:text-primary transition-colors">
                Comprehensive Anti-Corruption & Assets Declaration Act, 2026
              </h3>
              <p className="text-muted-foreground mb-6 line-clamp-3">
                Mandates all public officials and their immediate family members to publicly declare all domestic and foreign assets within 30 days of assuming office. Establishes an independent tribunal for investigating undisclosed wealth.
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                <div className="text-sm text-muted-foreground space-x-4">
                  <span>Sponsor: Sumana Shrestha</span>
                  <span className="hidden sm:inline">Votes: 215/275</span>
                </div>
                <Link href="/laws/anti-corruption-act-2026" className="text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-sm hover:-translate-y-0.5 transition-transform">
                  Read Details
                </Link>
              </div>
            </div>
          </section>

          {/* Timeline Feed */}
          <section className="flex flex-col gap-6">
            <h2 className="text-2xl font-display font-bold">Latest Activity</h2>
            <div className="pt-2">
              <StaggerList>
                <ActivityFeedItem 
                  date="Today, 10:00 AM"
                  title="Education Reform Bill Introduced to Parliament"
                  description="A sweeping bill aimed at overhauling public school administration and teacher accountability."
                  category="Bill Proposed"
                  status="pending"
                  href="/laws/edu-reform-2026"
                />
                <ActivityFeedItem 
                  date="Yesterday, 3:30 PM"
                  title="Fulfilled Promise: Digital Citizen Service Portal Launched"
                  description="The new portal allows citizens to apply for passports, vital records, and pay local taxes entirely online without visiting ward offices."
                  category="Promise Kept"
                  status="kept"
                  href="/promises/digital-portal"
                />
                <ActivityFeedItem 
                  date="March 12, 2026"
                  title="Vote on Foreign Investment Moderation"
                  description="The party voted along party lines (182-0) to increase the minimum threshold for foreign direct investment in retail sectors."
                  category="Floor Vote"
                  status="neutral"
                  href="/votes/fdi-retail"
                  isLast
                />
              </StaggerList>
            </div>
          </section>
        </div>

        {/* Right Col: Summaries & Quick Access */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          
          {/* Promise Tracker Widget */}
          <div className="bg-card border border-border p-6 rounded-md flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg">Citizen Contract</h3>
              <Link href="/promises" className="text-primary hover:bg-primary/10 p-1.5 rounded-sm transition-colors">
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            {/* Visual Bar (Flat implementation) */}
            <div className="flex flex-col gap-2">
              <div className="flex w-full h-3 rounded-full overflow-hidden bg-muted">
                <div className="bg-success h-full" style={{ width: '32%' }} />
                <div className="bg-warning h-full" style={{ width: '45%' }} />
                <div className="bg-destructive h-full" style={{ width: '8%' }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground font-medium px-1">
                <span>32% Kept</span>
                <span>45% In Progress</span>
                <span>8% Broken</span>
              </div>
            </div>

            <ul className="space-y-3 mt-2 text-sm">
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  Kept
                </span>
                <span className="font-semibold tabular-nums">22</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-warning border-t-transparent animate-spin" />
                  In Progress
                </span>
                <span className="font-semibold tabular-nums">31</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-destructive/20 border border-destructive flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-destructive rounded-full" />
                  </div>
                  Broken
                </span>
                <span className="font-semibold tabular-nums">6</span>
              </li>
            </ul>
          </div>

          {/* Quick Access Menu */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Laws & Bills", icon: BookOpen, href: "/laws", count: "45 Items" },
              { label: "Party MPs", icon: Users, href: "/members", count: "182 Members" },
              { label: "Floor Votes", icon: CheckCircle2, href: "/votes", count: "12 Sessions" },
              { label: "Statements", icon: FileText, href: "/timeline", count: "89 Docs" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col gap-2 p-4 rounded-md border border-border bg-card hover:border-primary/50 hover:bg-secondary/50 transition-colors group outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <div>
                  <div className="font-semibold text-sm group-hover:text-primary transition-colors">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.count}</div>
                </div>
              </Link>
            ))}
          </div>

        </div>

      </div>
    </PageTransition>
  )
}

