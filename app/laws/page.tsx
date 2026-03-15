import { PageTransition } from "@/components/animations/PageTransition"
import { StaggerList } from "@/components/animations/StaggerList"
import { FilterBar } from "@/components/shared/FilterBar"
import { StatusBadge, type StatusType } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { FileText, ArrowRight } from "lucide-react"
import Link from "next/link"

interface Law {
  id: string
  title: string
  code: string
  status: StatusType
  category: string
  date: string
  sponsor: string
  summary: string
}

const SAMPLE_LAWS: Law[] = [
  {
    id: "anti-corruption-act-2026",
    title: "Comprehensive Anti-Corruption & Assets Declaration Act, 2026",
    code: "BILL-2026-04",
    status: "passed",
    category: "Anti-Corruption",
    date: "March 10, 2026",
    sponsor: "Sumana Shrestha",
    summary: "Mandates all public officials and their immediate family members to publicly declare all domestic and foreign assets within 30 days of assuming office.",
  },
  {
    id: "edu-reform-2026",
    title: "National Education Administration Reform Bill",
    code: "BILL-2026-08",
    status: "pending",
    category: "Education",
    date: "March 14, 2026",
    sponsor: "Shishir Khanal",
    summary: "Aimed at overhauling public school administration, decentralizing budget authority to local wards, and instituting strict teacher accountability metrics.",
  },
  {
    id: "digital-privacy-2026",
    title: "Digital Governance & Citizen Privacy Act",
    code: "BILL-2026-11",
    status: "pending",
    category: "Governance",
    date: "Feb 28, 2026",
    sponsor: "Manish Jha",
    summary: "Establishes a unified electronic identity framework while applying strict penal codes against unauthorized data harvesting by private corporations.",
  },
  {
    id: "startup-tax-2026",
    title: "Startup & Innovation Tax Relief Bill",
    code: "BILL-2026-02",
    status: "passed",
    category: "Economy",
    date: "Feb 15, 2026",
    sponsor: "Swarnim Wagle",
    summary: "Provides a 5-year corporate tax holiday for newly registered tech and manufacturing startups, along with subsidized public lending rates.",
  },
  {
    id: "procurement-transparency",
    title: "Public Procurement Transparency Amendment",
    code: "BILL-2026-01",
    status: "rejected",
    category: "Anti-Corruption",
    date: "Jan 12, 2026",
    sponsor: "Rabi Lamichhane",
    summary: "Attempted to mandate live-streaming of all public tender openings and automatic blacklisting for contractors missing deadlines by over 30 days.",
  }
]

export default function LawsPage() {
  return (
    <PageTransition className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-8 w-full">
      {/* Header Section */}
      <div className="flex flex-col gap-4 max-w-3xl">
        <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
          Laws & Bills
        </h1>
        <p className="text-lg text-muted-foreground">
          Track every piece of legislation proposed, debated, or voted on by RSP lawmakers. 
          Monitor their commitments to the Citizen Contract in real-time.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar />

      {/* Data List */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between text-sm font-medium text-muted-foreground px-2">
          <span>{SAMPLE_LAWS.length} items found</span>
          <span className="hidden sm:inline">Sort by: Newest First</span>
        </div>

        <StaggerList className="flex flex-col gap-4">
          {SAMPLE_LAWS.map((law) => (
            <div 
              key={law.id} 
              className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 p-5 sm:p-6 border border-border bg-card rounded-md hover:border-primary/50 transition-colors group"
            >
              
              {/* Left Content */}
              <div className="flex flex-col gap-3 flex-1 w-full max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={
                    law.status === 'passed' ? 'success' : 
                    law.status === 'pending' ? 'warning' : 
                    law.status === 'rejected' ? 'destructive' : 'neutral'
                  }>
                    {law.status}
                  </StatusBadge>
                  <StatusBadge status="neutral">{law.category}</StatusBadge>
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">
                    {law.code}
                  </span>
                </div>
                
                <Link 
                  href={`/laws/${law.id}`}
                  className="outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm w-fit"
                >
                  <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
                    {law.title}
                  </h2>
                </Link>
                
                <p className="text-muted-foreground text-sm line-clamp-2 md:line-clamp-none">
                  {law.summary}
                </p>
              </div>

              {/* Right Content / Metadata */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-4 pt-4 sm:pt-0 border-t border-border sm:border-0 w-full sm:w-auto shrink-0">
                <div className="flex flex-col sm:items-end gap-1">
                  <span className="text-xs text-muted-foreground">Proposed date</span>
                  <span className="text-sm font-medium">{law.date}</span>
                  <span className="text-xs text-muted-foreground mt-1 hidden sm:inline">
                    Sponsor: <span className="font-medium text-foreground">{law.sponsor}</span>
                  </span>
                </div>
                
                <Button asChild variant="outline" className="w-full sm:w-auto mt-auto group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">
                  <Link href={`/laws/${law.id}`} className="gap-2">
                    <FileText className="w-4 h-4" />
                    Read Bill
                  </Link>
                </Button>
              </div>

            </div>
          ))}
        </StaggerList>
      </div>
    </PageTransition>
  )
}
