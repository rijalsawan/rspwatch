import { PageTransition } from "@/components/animations/PageTransition"
import { StaggerList } from "@/components/animations/StaggerList"
import { PromiseCard, type PromiseStatus } from "@/components/domain/PromiseCard"
import { FilterBar } from "@/components/shared/FilterBar"
import { CheckCircle2, Clock, XCircle, CircleDashed } from "lucide-react"

interface PromiseData {
  id: string
  title: string
  description: string
  category: string
  status: PromiseStatus
  source: string
  timeline?: string
}

const SAMPLE_PROMISES: PromiseData[] = [
  {
    id: "prm-1",
    title: "Launch One-Stop Digital Citizen Service Portal",
    description: "Digitize 90% of basic ward services (birth certificates, local taxes, passport applications) to eliminate middle-men and long queues.",
    category: "Governance",
    status: "kept",
    source: "2026 Election Manifesto (Pg. 12)",
    timeline: "First 100 Days",
  },
  {
    id: "prm-2",
    title: "Mandatory Asset Declaration for All MPs",
    description: "All RSP MPs and participating coalition members must publicly declare their domestic and foreign assets.",
    category: "Anti-Corruption",
    status: "kept",
    source: "Citizen Contract",
    timeline: "First 30 Days",
  },
  {
    id: "prm-3",
    title: "Overhaul Public School Management Boards",
    description: "Remove partisan political appointments from local school boards and replace them with merit-based educators and parent committees.",
    category: "Education",
    status: "in-progress",
    source: "2026 Election Manifesto (Pg. 24)",
    timeline: "Year 1",
  },
  {
    id: "prm-4",
    title: "Establish Startup Fund and 5-Year Tax Holiday",
    description: "Create a Rs. 5 Billion innovation fund and a 5-year corporate tax block exemption for newly registered tech startups.",
    category: "Economy",
    status: "in-progress",
    source: "Economy Policy Brief 2026",
    timeline: "Year 1",
  },
  {
    id: "prm-5",
    title: "Live-Stream Public Procurement Processes",
    description: "Ensure that all public tender openings above Rs. 10 Million are live-streamed to prevent bid tampering.",
    category: "Anti-Corruption",
    status: "broken",
    source: "Citizen Contract",
    timeline: "First 100 Days",
  },
  {
    id: "prm-6",
    title: "Universal Basic Healthcare Insurance Expansion",
    description: "Expand the national health insurance coverage to cover 80% of citizens by making enrollment automatic with national ID issuance.",
    category: "Health",
    status: "not-started",
    source: "2026 Election Manifesto (Pg. 18)",
    timeline: "Year 3",
  },
]

export default function PromisesPage() {
  const stats = {
    total: SAMPLE_PROMISES.length,
    kept: SAMPLE_PROMISES.filter(p => p.status === 'kept').length,
    inProgress: SAMPLE_PROMISES.filter(p => p.status === 'in-progress').length,
    broken: SAMPLE_PROMISES.filter(p => p.status === 'broken').length,
    notStarted: SAMPLE_PROMISES.filter(p => p.status === 'not-started').length,
  }

  return (
    <PageTransition className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-10 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-4 max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
            Promise Tracker
          </h1>
          <p className="text-lg text-muted-foreground">
            A comprehensive scoreboard of the commitments laid out in the RSP's 
            Citizen Contract and 2026 Election Manifesto. We track what's delivered, 
            what's stalled, and what's broken.
          </p>
        </div>
      </div>

      {/* Aggregate Stats Dash */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Kept", count: stats.kept, icon: CheckCircle2, color: "text-success", bg: "bg-success/10", border: "border-success/20" },
          { label: "In Progress", count: stats.inProgress, icon: Clock, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
          { label: "Broken", count: stats.broken, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
          { label: "Not Started", count: stats.notStarted, icon: CircleDashed, color: "text-muted-foreground", bg: "bg-muted/50", border: "border-border" }
        ].map((stat, i) => (
          <div key={i} className={`p-5 rounded-md border ${stat.border} flex flex-col gap-3 bg-card`}>
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-sm ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className="font-semibold tracking-wide uppercase text-sm text-foreground">
                {stat.label}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-display font-bold tabular-nums">
                {stat.count}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                ({Math.round((stat.count / stats.total) * 100)}%)
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bars per Category (Visualized as flat chunks) */}
      <div className="bg-card border border-border p-6 rounded-md flex flex-col gap-6">
        <h3 className="font-display font-bold text-lg">Category Fulfillment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          {[
            { cat: "Governance", kept: 80, inProgress: 15, broken: 5 },
            { cat: "Economy", kept: 45, inProgress: 50, broken: 5 },
            { cat: "Anti-Corruption", kept: 60, inProgress: 20, broken: 20 },
            { cat: "Education", kept: 20, inProgress: 70, broken: 10 },
          ].map((c) => (
            <div key={c.cat} className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span>{c.cat}</span>
                <span className="text-muted-foreground">{c.kept}% Kept</span>
              </div>
              {/* Flat discrete progress bar */}
              <div className="flex w-full h-2.5 rounded-full overflow-hidden bg-muted">
                <div className="bg-success h-full" style={{ width: `${c.kept}%` }} />
                <div className="bg-warning h-full" style={{ width: `${c.inProgress}%` }} />
                <div className="bg-destructive h-full" style={{ width: `${c.broken}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Content */}
      <div className="flex flex-col gap-6">
        <FilterBar />

        {/* Grid of Promise Cards */}
        <StaggerList className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {SAMPLE_PROMISES.map((promise) => (
            <PromiseCard
              key={promise.id}
              id={promise.id}
              title={promise.title}
              description={promise.description}
              category={promise.category}
              status={promise.status}
              source={promise.source}
              timeline={promise.timeline}
            />
          ))}
        </StaggerList>
      </div>

    </PageTransition>
  )
}
