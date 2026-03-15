"use client"

import { PageTransition } from "@/components/animations/PageTransition"
import { StaggerList } from "@/components/animations/StaggerList"
import { MemberCard } from "@/components/domain/MemberCard"
import { StatCard } from "@/components/shared/StatCard"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, SlidersHorizontal } from "lucide-react"

const SAMPLE_MEMBERS = [
  { id: "balen-shah", name: "Balen Shah", role: "Prime Minister", constituency: "Kathmandu-1", province: "Bagmati", attendance: 98 },
  { id: "rabi-lamichhane", name: "Rabi Lamichhane", role: "Deputy PM / Home Minister", constituency: "Chitwan-2", province: "Bagmati", attendance: 95 },
  { id: "sumana-shrestha", name: "Sumana Shrestha", role: "Minister of Education", constituency: "Kathmandu-8", province: "Bagmati", attendance: 99 },
  { id: "swarnim-wagle", name: "Dr. Swarnim Wagle", role: "Minister of Finance", constituency: "Tanahun-1", province: "Bagmati", attendance: 96 },
  { id: "sobita-gautam", name: "Sobita Gautam", role: "Member of Parliament", constituency: "Kathmandu-2", province: "Bagmati", attendance: 92 },
  { id: "toshima-karki", name: "Dr. Toshima Karki", role: "Minister of Health", constituency: "Lalitpur-3", province: "Bagmati", attendance: 97 },
  { id: "manish-jha", name: "Manish Jha", role: "Member of Parliament", constituency: "PR (Proportional)", province: "Madhesh", attendance: 88 },
  { id: "shishir-khanal", name: "Shishir Khanal", role: "Member of Parliament", constituency: "Kathmandu-6", province: "Bagmati", attendance: 94 },
]

export default function MembersPage() {
  const provinces = ["All Provinces", "Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim"]
  const roles = ["All Roles", "Cabinet Minister", "Member of Parliament", "Committee Chair"]

  return (
    <PageTransition className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-10 w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 max-w-3xl">
        <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
          Party Members & MPs
        </h1>
        <p className="text-lg text-muted-foreground">
          Explore the profiles, attendance records, and voting history of all 182 
          elected RSP representatives currently serving in the federal parliament.
        </p>
      </div>

      {/* Stats Dash */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Elected MPs" value="182" />
        <StatCard label="Cabinet Ministers" value="14" />
        <StatCard label="Female Representation" value="38%" trend={{ value: "Highest in Parliament", positive: true }} />
        <StatCard label="Avg. Attendance" value="94%" trend={{ value: "Since March 2026", positive: true }} />
      </div>

      {/* Filter and Content */}
      <div className="flex flex-col gap-6">
        
        {/* Members Specific Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 bg-card border border-border rounded-md">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or constituency..." 
              className="pl-9 bg-background"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative inline-flex">
              <select className="h-10 w-full md:w-auto appearance-none rounded-md border border-input bg-background pl-3 pr-10 py-2 text-sm ring-offset-background cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                {provinces.map((p) => (
                  <option key={p} value={p}>{p}</option>
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
                {roles.map((r) => (
                  <option key={r} value={r}>{r}</option>
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
              <span className="sm:hidden lg:inline">Filters</span>
            </Button>
          </div>
        </div>

        {/* Directory Grid */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-sm font-medium text-muted-foreground px-2">
            <span>Showing sample records (8/182)</span>
            <span className="hidden sm:inline">Sort by: Role (Highest First)</span>
          </div>
          
          <StaggerList className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {SAMPLE_MEMBERS.map((member) => (
              <MemberCard
                key={member.id}
                id={member.id}
                name={member.name}
                role={member.role}
                constituency={member.constituency}
                province={member.province}
                attendance={member.attendance}
              />
            ))}
          </StaggerList>
        </div>

      </div>
    </PageTransition>
  )
}
