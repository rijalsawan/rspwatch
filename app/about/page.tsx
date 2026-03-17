"use client"

import { PageTransition } from "@/components/animations/PageTransition"
import { Shield, Database, Github, Code, Users } from "lucide-react"

export default function AboutPage() {
  return (
    <PageTransition className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-16 flex flex-col gap-16 w-full prose-headings:font-display">
      
      {/* Header */}
      <section className="flex flex-col gap-6 text-center items-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
          Radical Transparency.
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
          Parliament Watch is an open-source, non-partisan accountability tracker designed to monitor
          the commitments and actions of all political parties in Nepal's Parliament.
        </p>
      </section>

      {/* Philosophy Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card border border-border p-8 rounded-md flex flex-col gap-4">
          <Shield className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-bold">Non-Partisan & Independent</h2>
          <p className="text-muted-foreground leading-relaxed">
            This platform is strictly independent and unaffiliated with any political party or organization.
            We do not provide editorial opinions. We strictly provide raw, verified parliamentary data tracked daily
            from public government sources.
          </p>
        </div>
        <div className="bg-card border border-border p-8 rounded-md flex flex-col gap-4">
          <Database className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-bold">Data Methodology</h2>
          <p className="text-muted-foreground leading-relaxed">
            Data is aggregated daily via automated web scraping and manual verification referencing 
            the official Nepal Parliament website <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded ml-1">hr.parliament.gov.np</span> and public registry 
            gazettes.
          </p>
        </div>
      </section>

      {/* Tech Stack & Open Source */}
      <section className="flex flex-col gap-8 border-t border-border pt-12">
        <div className="flex flex-col gap-3">
          <h2 className="text-3xl font-bold">Built for the Open Web</h2>
          <p className="text-lg text-muted-foreground">
            The entire codebase and scraping infrastructure powering Parliament Watch is freely available on GitHub.
            We encourage researchers, journalists, and civic-tech hackers to audit our logic or contribute features.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Next.js 16", icon: Code },
            { label: "TypeScript", icon: Code },
            { label: "Tailwind CSS", icon: Code },
            { label: "100% Open Source", icon: Github },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center justify-center gap-3 p-6 border border-border rounded-md bg-card/50">
              <item.icon className="w-6 h-6 text-muted-foreground" />
              <span className="font-medium text-sm text-center">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Contribution Guidelines */}
      <section id="contribute" className="flex flex-col gap-6 bg-primary/5 border border-primary/20 p-8 md:p-10 rounded-md">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">How to Contribute</h2>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Noticed an error in the voting record? Believe a promise status indicator is improperly categorized? 
          Civil accountability is a community effort. You can submit data correction requests directly through our 
          repository issue tracker.
        </p>
        <a
          href="https://github.com/rijalsawan/rspwatch/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-md w-fit hover:-translate-y-0.5 transition-transform mt-2"
        >
          <Github className="w-4 h-4" />
          Report an Issue via GitHub
        </a>
      </section>

    </PageTransition>
  )
}
