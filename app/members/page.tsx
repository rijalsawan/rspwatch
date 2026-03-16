"use client"

import { useEffect, useState, useCallback } from "react"
import { PageTransition } from "@/components/animations/PageTransition"
import { StaggerList } from "@/components/animations/StaggerList"
import { MemberCard } from "@/components/domain/MemberCard"
import { StatCard } from "@/components/shared/StatCard"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, SlidersHorizontal } from "lucide-react"

interface MemberData {
  id: string
  slug: string
  name: string
  role: string
  constituency: string
  province: string
  attendancePercent: number | null
}

const PROVINCES = ["All Provinces", "Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim"]

export default function MembersPage() {
  const [members, setMembers] = useState<MemberData[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [province, setProvince] = useState("All Provinces")

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: "200" })
      if (search) params.set("q", search)
      if (province !== "All Provinces") params.set("province", province)

      const res = await fetch(`/api/members?${params}`)
      const json = await res.json()
      if (json.data) {
        setMembers(json.data)
        setTotal(json.meta?.total ?? json.data.length)
      }
    } catch (e) {
      console.error("Failed to load members:", e)
    } finally {
      setLoading(false)
    }
  }, [search, province])

  useEffect(() => {
    const timer = setTimeout(fetchMembers, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [fetchMembers, search])

  const cabinetCount = members.filter(m => m.role !== "Member of Parliament").length
  const avgAttendance = members.length > 0
    ? Math.round(members.reduce((sum, m) => sum + (m.attendancePercent ?? 0), 0) / members.length)
    : 0

  return (
    <PageTransition className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-10 w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 max-w-3xl">
        <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
          Party Members & MPs
        </h1>
        <p className="text-lg text-muted-foreground">
          Explore the profiles, attendance records, and voting history of all
          elected RSP representatives currently serving in the federal parliament.
        </p>
      </div>

      {/* Stats Dash */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Elected MPs" value={total} />
        <StatCard label="Cabinet Ministers" value={cabinetCount} />
        <StatCard label="Avg. Attendance" value={`${avgAttendance}%`} trend={{ value: "Since March 2026", positive: true }} />
        <StatCard label="Provinces Represented" value={new Set(members.map(m => m.province)).size} />
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative inline-flex">
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="h-10 w-full md:w-auto appearance-none rounded-md border border-input bg-background pl-3 pr-10 py-2 text-sm ring-offset-background cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={() => { setSearch(""); setProvince("All Provinces") }}>
              <SlidersHorizontal className="w-4 h-4" />
              <span className="sm:hidden lg:inline">Reset</span>
            </Button>
          </div>
        </div>

        {/* Directory Grid */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-sm font-medium text-muted-foreground px-2">
            <span>Showing {members.length} of {total} members</span>
            <span className="hidden sm:inline">Sort by: Role (Highest First)</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-md p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-muted rounded-full" />
                    <div className="flex-1"><div className="h-4 bg-muted rounded w-3/4 mb-1" /><div className="h-3 bg-muted rounded w-1/2" /></div>
                  </div>
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : members.length > 0 ? (
            <StaggerList className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {members.map((member) => (
                <MemberCard
                  key={member.id}
                  id={member.slug}
                  name={member.name}
                  role={member.role}
                  constituency={member.constituency}
                  province={member.province}
                  attendance={member.attendancePercent ?? undefined}
                />
              ))}
            </StaggerList>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No members found matching your filters.
            </div>
          )}
        </div>

      </div>
    </PageTransition>
  )
}
