"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, SlidersHorizontal } from "lucide-react"

export function FilterBar() {
  const categories = ["All", "Economy", "Education", "Health", "Anti-Corruption", "Governance"]
  const statuses = ["Any Status", "Passed", "Pending", "Rejected", "Withdrawn"]

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 bg-card border border-border rounded-md">
      
      {/* Search Input */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search by keyword, bill ID, or MP..." 
          className="pl-9 bg-background"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Mock Dropdowns using native select for simplicity & robust form accessibility */}
        <div className="relative inline-flex">
          <select className="h-10 w-full md:w-auto appearance-none rounded-md border border-input bg-background pl-3 pr-10 py-2 text-sm ring-offset-background cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
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

        <div className="relative inline-flex">
          <select className="h-10 w-full md:w-auto appearance-none rounded-md border border-input bg-background pl-3 pr-10 py-2 text-sm ring-offset-background cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        <Button variant="outline" className="gap-2 w-full sm:w-auto">
          <SlidersHorizontal className="w-4 h-4" />
          <span className="sm:hidden lg:inline">Detailed Filters</span>
        </Button>
      </div>

    </div>
  )
}
