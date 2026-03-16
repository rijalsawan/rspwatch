"use client"

import { useState, useMemo } from "react"
import { useCachedFetch } from "@/hooks/use-cached-fetch"
import { PageTransition } from "@/components/animations/PageTransition"
import { StaggerList } from "@/components/animations/StaggerList"
import { MemberCard } from "@/components/domain/MemberCard"
import { StatCard } from "@/components/shared/StatCard"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, SlidersHorizontal, Users, Building2, ChevronDown } from "lucide-react"

interface MemberData {
  id: string
  slug: string
  name: string
  nameNepali?: string | null
  role: string
  constituency: string
  province: string
  attendancePercent: number | null
  photoUrl?: string | null
  phone?: string | null
  sourceUrl?: string | null
}

const PROVINCES = ["All Provinces", "National", "Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim"]
const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "role", label: "Role" },
  { value: "province", label: "Province" },
  { value: "attendance", label: "Attendance" },
]

export default function MembersPage() {
  const [search, setSearch] = useState("")
  const [province, setProvince] = useState("All Provinces")
  const [memberType, setMemberType] = useState<"all" | "executive" | "mp">("all")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Construct the API URL based on current filters (excluding search for client-side filtering)
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({ limit: "200" })
    if (province !== "All Provinces") params.set("province", province)
    if (memberType !== "all") params.set("type", memberType)
    params.set("sort", sortBy)
    params.set("order", sortOrder)

    return `/api/members?${params}`
  }, [province, memberType, sortBy, sortOrder])

  // Use cached fetch with constructed URL
  const { data: membersResponse, loading } = useCachedFetch<{data: MemberData[], meta?: {total: number}}>(apiUrl)

  // Extract data from response
  const allMembers = membersResponse?.data ?? []

  // Client-side filtering for search (avoids API calls on every keystroke)
  const members = search
    ? allMembers.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.nameNepali && m.nameNepali.includes(search)) ||
        m.constituency.toLowerCase().includes(search.toLowerCase()) ||
        m.province.toLowerCase().includes(search.toLowerCase())
      )
    : allMembers

  const total = membersResponse?.meta?.total ?? allMembers.length

  const executiveCount = members.filter(m =>
    m.constituency === "Central Committee" || m.province === "National"
  ).length
  const mpCount = members.filter(m =>
    m.constituency !== "Central Committee" && m.province !== "National"
  ).length
  const avgAttendance = members.length > 0
    ? Math.round(members.filter(m => m.attendancePercent != null).reduce((sum, m) => sum + (m.attendancePercent ?? 0), 0) / Math.max(1, members.filter(m => m.attendancePercent != null).length))
    : 0

  const resetFilters = () => {
    setSearch("")
    setProvince("All Provinces")
    setMemberType("all")
    setSortBy("name")
    setSortOrder("asc")
  }

  return (
    <PageTransition className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-10 w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 max-w-3xl">
        <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
          Party Members & MPs
        </h1>
        <p className="text-lg text-muted-foreground">
          Explore the profiles, attendance records, and voting history of all
          RSP representatives — from Central Committee executives to elected MPs.
        </p>
      </div>

      {/* Stats Dash */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={total} />
        <StatCard label="Executive Committee" value={executiveCount} />
        <StatCard label="Elected MPs" value={mpCount} />
        <StatCard label="Avg. Attendance" value={`${avgAttendance}%`} trend={{ value: "Since March 2026", positive: avgAttendance >= 70 }} />
      </div>

      {/* Member Type Tabs */}
      <Tabs value={memberType} onValueChange={(v) => setMemberType(v as typeof memberType)} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all" className="gap-2">
            <Users className="w-4 h-4" />
            All Members
          </TabsTrigger>
          <TabsTrigger value="executive" className="gap-2">
            <Building2 className="w-4 h-4" />
            Executive
          </TabsTrigger>
          <TabsTrigger value="mp" className="gap-2">
            <Users className="w-4 h-4" />
            MPs
          </TabsTrigger>
        </TabsList>
      </Tabs>

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
            {/* Province filter */}
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
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>

            {/* Sort field */}
            <div className="relative inline-flex">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 w-full md:w-auto appearance-none rounded-md border border-input bg-background pl-3 pr-10 py-2 text-sm ring-offset-background cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>Sort: {opt.label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>

            {/* Sort order toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
              className="h-10"
            >
              {sortOrder === "asc" ? "A → Z" : "Z → A"}
            </Button>

            <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={resetFilters}>
              <SlidersHorizontal className="w-4 h-4" />
              <span className="sm:hidden lg:inline">Reset</span>
            </Button>
          </div>
        </div>

        {/* Directory Grid */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-sm font-medium text-muted-foreground px-2">
            <span>Showing {members.length} of {total} members</span>
            <span className="hidden sm:inline">
              {memberType === "executive" ? "Central Committee Members" :
               memberType === "mp" ? "Elected Representatives" :
               "All Members"}
            </span>
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
                  nameNepali={member.nameNepali ?? undefined}
                  role={member.role}
                  constituency={member.constituency}
                  province={member.province}
                  attendance={member.attendancePercent ?? undefined}
                  photoUrl={member.photoUrl ?? undefined}
                  phone={member.phone ?? undefined}
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
