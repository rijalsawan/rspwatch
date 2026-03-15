"use client"

import { PageTransition } from "@/components/animations/PageTransition"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink, Calendar, Users, Scale, FileText, CheckCircle2, History } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

// Mock fetch wrapper to simulate real data retrieval based on Slug
export default function LawDetailPage() {
  const { slug } = useParams()
  
  // Dummy specific dataset mapping logic
  const isAntiCorruption = slug === "anti-corruption-act-2026"
  const title = isAntiCorruption 
    ? "Comprehensive Anti-Corruption & Assets Declaration Act, 2026" 
    : "Education Administration Reform Bill"

  const defaultStatus = isAntiCorruption ? "passed" : "pending"
  
  return (
    <PageTransition className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-10 w-full">
      
      {/* 1. Breadcrumbs & Metadata Header */}
      <div className="flex flex-col gap-6">
        <Link 
          href="/laws" 
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors w-fit outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Laws & Bills
        </Link>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={defaultStatus === 'passed' ? 'success' : 'warning'}>
              {defaultStatus.toUpperCase()}
            </StatusBadge>
            <span className="text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-sm flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              BILL-2026-{isAntiCorruption ? "04" : "08"}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-bold leading-tight">
            {title}
          </h1>

          <p className="text-lg text-muted-foreground max-w-4xl leading-relaxed">
            {isAntiCorruption 
              ? "Mandates all public officials and their immediate family members to publicly declare all domestic and foreign assets within 30 days of assuming office. Establishes an independent tribunal for investigating undisclosed wealth."
              : "Aimed at overhauling public school administration, decentralizing budget authority to local wards, and instituting strict teacher accountability metrics."
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* LEFT COLUMN: Main Detail Flow */}
        <div className="lg:col-span-8 flex flex-col gap-10">
          
          {/* Timeline Milestones */}
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
              <History className="w-5 h-5 text-muted-foreground" />
              Legislative Timeline
            </h2>
            <div className="flex flex-col gap-4 bg-card border border-border rounded-md p-5 md:p-6">
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold">{isAntiCorruption ? "Enacted Into Law" : "Awaiting Committee Review"}</span>
                    <span className="text-sm text-muted-foreground">{isAntiCorruption ? "March 15, 2026" : "Pending"}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Presidential Assent completed.</p>
                </div>
              </div>
              <div className="w-px h-6 bg-border ml-1 my-[-8px]" />
              <div className="flex items-start gap-4">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${isAntiCorruption ? 'bg-muted-foreground' : 'bg-primary'}`} />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold">Passed Parliament Vote</span>
                    <span className="text-sm text-muted-foreground">March 10, 2026</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Passed with 215/275 votes. RSP voted across strict party lines.</p>
                </div>
              </div>
              <div className="w-px h-6 bg-border ml-1 my-[-8px]" />
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-muted-foreground mt-2 shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold">Introduced to Floor</span>
                    <span className="text-sm text-muted-foreground">Feb 12, 2026</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Full Text Analysis (Curated) */}
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
              <Scale className="w-5 h-5 text-muted-foreground" />
              Key Provisions & Impact
            </h2>
            <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground text-base leading-loose space-y-4">
              <p>
                This legislation categorically rewrites the asset declaration rules for incoming politicians. Previously, records were held securely within the Prime Minister's office and kept out of the public domain. 
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-4 text-foreground/80">
                <li><strong className="text-foreground">Public Accessibility:</strong> All MP assets are published directly to a central digitized citizen portal.</li>
                <li><strong className="text-foreground">Immediate Family Scope:</strong> Spouses, dependent children, and parents residing at the primary address are subject to strict auditing.</li>
                <li><strong className="text-foreground">Tribunal Power:</strong> The National Vigilance Center is granted subpoena abilities previously restricted to Supreme Court domains.</li>
              </ul>
              <p className="mt-4">
                This bill was one of the cornerstone promises in the RSP's Citizen Contract document published directly before the election.
              </p>
            </div>
            <div className="mt-2">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="w-4 h-4" /> Download Original Bill (PDF)
              </Button>
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: Roll Call & Stats Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          <div className="bg-card border border-border rounded-md p-6 flex flex-col gap-5 sticky top-[88px]">
            <h3 className="font-display font-bold text-lg border-b border-border pb-2">Sponsorship</h3>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border border-border">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold">{isAntiCorruption ? "Sumana Shrestha" : "Shishir Khanal"}</span>
                <span className="text-xs text-muted-foreground">Primary Sponsor</span>
              </div>
            </div>

            <h3 className="font-display font-bold text-lg border-b border-border pb-2 mt-2">RSP Voting Record</h3>
            
            {isAntiCorruption ? (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span className="font-semibold text-success">Unanimous Yea (182)</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  No MPs from the Rastriya Swatantra Party defected or abstained from this vote block. Total parliamentary vote count was 215/275.
                </div>
                <Link href="/votes" className="text-sm font-medium text-primary hover:underline mt-2 inline-block w-fit">
                  View Full Roll Call
                </Link>
              </>
            ) : (
              <div className="text-sm text-muted-foreground flex flex-col gap-2">
                <span className="flex items-center gap-2 p-3 bg-muted/50 rounded-sm">
                  <Calendar className="w-4 h-4 shrink-0" />
                  Awaiting Floor Vote placement. Scheduled for April 2nd docket.
                </span>
              </div>
            )}
          </div>

        </div>

      </div>
    </PageTransition>
  )
}
