"use client"

import React, { useState } from "react"
import { useCachedFetch } from "@/hooks/use-cached-fetch"
import { motion } from "framer-motion"
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer,
} from "recharts"
import { StatCard } from "@/components/shared/StatCard"
import { PageTransition } from "@/components/animations/PageTransition"
import {
  Info, Users, TrendingUp, Scale, CheckCircle2,
  AlertTriangle, BarChart3, Activity,
} from "lucide-react"

// ─── Colour palette ───────────────────────────────────────────────────────────
const C = {
  kept:       "#16a34a",
  inProgress: "#f59e0b",
  notStarted: "#64748b",
  broken:     "#dc2626",
  yea:        "#16a34a",
  nay:        "#dc2626",
  abstain:    "#f59e0b",
  absent:     "#94a3b8",
  passed:     "#16a34a",
  defeated:   "#dc2626",
  draft:      "#94a3b8",
  proposed:   "#60a5fa",
  committee:  "#f59e0b",
  enacted:    "#22d3ee",
  rejected:   "#dc2626",
  low:        "#64748b",
  medium:     "#f59e0b",
  high:       "#f97316",
  critical:   "#dc2626",
  amendment:  "#a78bfa",
  procedural: "#64748b",
  finalPass:  "#16a34a",
} as const

// ─── Shared tooltip style ─────────────────────────────────────────────────────
const TT = {
  contentStyle: {
    backgroundColor: "var(--card)",
    borderColor: "var(--border)",
    color: "var(--foreground)",
    borderRadius: "8px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
    fontSize: "13px",
  },
  itemStyle: { color: "var(--foreground)" },
  labelStyle: { color: "var(--muted-foreground)", fontWeight: 600, marginBottom: 4 },
  cursor: { fill: "var(--muted)", opacity: 0.3 },
}

// ─── Section wrapper with scroll-triggered animation ─────────────────────────
function Section({ children, delay = 0, className = "" }: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

// ─── Chart card wrapper ───────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children, height = 320 }: {
  title: string
  subtitle?: string
  children: React.ReactNode
  height?: number
}) {
  return (
    <div className="bg-card border border-border rounded-md p-6 flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-display font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  )
}

// ─── Skeleton pulse ───────────────────────────────────────────────────────────
function ChartSkeleton({ height = 320 }: { height?: number }) {
  return (
    <div
      className="bg-muted/50 rounded-md animate-pulse flex items-end gap-2 px-6 pb-6 pt-4"
      style={{ height }}
    >
      {[55, 80, 40, 95, 65, 75, 50, 85, 60, 45].map((h, i) => (
        <div
          key={i}
          className="flex-1 bg-muted rounded-sm"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  )
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({ icon: Icon, title, subtitle }: {
  icon: React.ElementType
  title: string
  subtitle: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-md bg-primary/10">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-semibold">{title}</h2>
      </div>
      <p className="text-sm text-muted-foreground pl-1">{subtitle}</p>
    </div>
  )
}

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface StatsData {
  activeMps:        number
  lawsPassed:       number
  promisesTracked:  number
  promisesKept:     number
  daysInPower:      number
  totalVotes:       number
  promisesByStatus: Record<string, number>
}

interface PromiseMeta {
  byStatus:   Record<string, number>
  byCategory: Record<string, Record<string, number>>
}

interface MemberItem {
  province:          string
  attendancePercent: number | null
  role:              string
}

interface LawItem {
  status:   string
  category: string
}

interface VoteItem {
  type:    string
  outcome: string
  breakdown: { yea: number; nay: number; abstain: number; absent: number }
}

interface ControversyItem {
  severity:   string
  isResolved: boolean
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false)
  React.useEffect(() => { setMounted(true) }, [])

  const { data: statsRes,  loading: l1 } = useCachedFetch<{ data: StatsData }>("/api/stats")
  const { data: promisesRes, loading: l2 } = useCachedFetch<{ data: unknown[]; meta: PromiseMeta }>("/api/promises?limit=100")
  const { data: membersRes, loading: l3 } = useCachedFetch<{ data: MemberItem[] }>("/api/members?limit=200")
  const { data: lawsRes,    loading: l4 } = useCachedFetch<{ data: LawItem[] }>("/api/laws?limit=100")
  const { data: votesRes,   loading: l5 } = useCachedFetch<{ data: VoteItem[] }>("/api/votes?limit=100")
  const { data: contrRes,   loading: l6 } = useCachedFetch<{ data: ControversyItem[] }>("/api/controversies?limit=50")

  const stats       = statsRes?.data ?? null
  const promiseMeta = promisesRes?.meta ?? null
  const members     = membersRes?.data ?? []
  const laws        = lawsRes?.data ?? []
  const votes       = votesRes?.data ?? []
  const controvs    = contrRes?.data ?? []

  const anyLoading = l1 || l2 || l3 || l4 || l5 || l6

  // ── Promise: overall status donut ──────────────────────────────────────────
  const promiseDonut = promiseMeta?.byStatus
    ? [
        { name: "Kept",        value: promiseMeta.byStatus.KEPT        ?? 0, color: C.kept       },
        { name: "In Progress", value: promiseMeta.byStatus.IN_PROGRESS ?? 0, color: C.inProgress },
        { name: "Not Started", value: promiseMeta.byStatus.NOT_STARTED ?? 0, color: C.notStarted },
        { name: "Broken",      value: promiseMeta.byStatus.BROKEN      ?? 0, color: C.broken     },
      ].filter(d => d.value > 0)
    : []

  // ── Promise: line chart by category ────────────────────────────────────────
  const promiseCategoryData = promiseMeta?.byCategory
    ? Object.entries(promiseMeta.byCategory).map(([name, s]) => ({
        name,
        Kept:          s.KEPT        ?? 0,
        "In Progress": s.IN_PROGRESS ?? 0,
        "Not Started": s.NOT_STARTED ?? 0,
        Broken:        s.BROKEN      ?? 0,
      }))
    : []

  // ── Laws: status distribution ───────────────────────────────────────────────
  const lawStatusMap: Record<string, number> = {}
  for (const l of laws) lawStatusMap[l.status] = (lawStatusMap[l.status] ?? 0) + 1
  const lawStatusData = [
    { name: "Draft",     value: lawStatusMap.DRAFT     ?? 0, color: C.draft     },
    { name: "Proposed",  value: lawStatusMap.PROPOSED  ?? 0, color: C.proposed  },
    { name: "Committee", value: lawStatusMap.COMMITTEE ?? 0, color: C.committee },
    { name: "Passed",    value: lawStatusMap.PASSED    ?? 0, color: C.passed    },
    { name: "Enacted",   value: lawStatusMap.ENACTED   ?? 0, color: C.enacted   },
    { name: "Rejected",  value: lawStatusMap.REJECTED  ?? 0, color: C.rejected  },
  ].filter(d => d.value > 0)

  // ── Laws: top categories ─────────────────────────────────────────────────────
  const lawCatMap: Record<string, number> = {}
  for (const l of laws) lawCatMap[l.category] = (lawCatMap[l.category] ?? 0) + 1
  const lawCatData = Object.entries(lawCatMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }))
    .reverse() // horizontal bar — smallest at top

  // ── Votes: outcomes ──────────────────────────────────────────────────────────
  const voteOutcomeMap: Record<string, number> = {}
  for (const v of votes) voteOutcomeMap[v.outcome] = (voteOutcomeMap[v.outcome] ?? 0) + 1
  const voteOutcomeData = [
    { name: "Passed",   value: voteOutcomeMap.PASSED   ?? 0, color: C.passed   },
    { name: "Defeated", value: voteOutcomeMap.DEFEATED ?? 0, color: C.defeated },
  ].filter(d => d.value > 0)

  // ── Votes: type distribution ─────────────────────────────────────────────────
  const voteTypeMap: Record<string, number> = {}
  for (const v of votes) voteTypeMap[v.type] = (voteTypeMap[v.type] ?? 0) + 1
  const voteTypeData = [
    { name: "Final Passage", value: voteTypeMap.FINAL_PASSAGE ?? 0, color: C.finalPass  },
    { name: "Amendment",     value: voteTypeMap.AMENDMENT     ?? 0, color: C.amendment  },
    { name: "Procedural",    value: voteTypeMap.PROCEDURAL    ?? 0, color: C.procedural },
  ].filter(d => d.value > 0)

  // ── Votes: aggregate YEA/NAY/ABSTAIN/ABSENT ──────────────────────────────────
  const totalYea     = votes.reduce((s, v) => s + v.breakdown.yea,     0)
  const totalNay     = votes.reduce((s, v) => s + v.breakdown.nay,     0)
  const totalAbstain = votes.reduce((s, v) => s + v.breakdown.abstain, 0)
  const totalAbsent  = votes.reduce((s, v) => s + v.breakdown.absent,  0)
  const voteAlignData = [
    { name: "YEA",     value: totalYea,     color: C.yea     },
    { name: "NAY",     value: totalNay,     color: C.nay     },
    { name: "ABSTAIN", value: totalAbstain, color: C.abstain },
    { name: "ABSENT",  value: totalAbsent,  color: C.absent  },
  ].filter(d => d.value > 0)

  // ── Members: province distribution ──────────────────────────────────────────
  const provinceMap: Record<string, number> = {}
  for (const m of members) {
    if (m.province) provinceMap[m.province] = (provinceMap[m.province] ?? 0) + 1
  }
  const provinceData = Object.entries(provinceMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))

  // ── Members: attendance histogram ────────────────────────────────────────────
  const buckets = { "0–20%": 0, "21–40%": 0, "41–60%": 0, "61–80%": 0, "81–100%": 0, Unknown: 0 }
  for (const m of members) {
    if (m.attendancePercent === null || m.attendancePercent === undefined) { buckets.Unknown++; continue }
    const p = m.attendancePercent
    if (p <= 20) buckets["0–20%"]++
    else if (p <= 40) buckets["21–40%"]++
    else if (p <= 60) buckets["41–60%"]++
    else if (p <= 80) buckets["61–80%"]++
    else buckets["81–100%"]++
  }
  const attendanceData = Object.entries(buckets)
    .filter(([, v]) => v > 0)
    .map(([name, count]) => ({ name, count }))

  // ── Controversies: severity ───────────────────────────────────────────────────
  const sevMap: Record<string, number> = {}
  for (const c of controvs) sevMap[c.severity] = (sevMap[c.severity] ?? 0) + 1
  const severityData = [
    { name: "Low",      value: sevMap.LOW      ?? 0, color: C.low      },
    { name: "Medium",   value: sevMap.MEDIUM   ?? 0, color: C.medium   },
    { name: "High",     value: sevMap.HIGH     ?? 0, color: C.high     },
    { name: "Critical", value: sevMap.CRITICAL ?? 0, color: C.critical },
  ].filter(d => d.value > 0)

  // ── Controversies: resolution ─────────────────────────────────────────────────
  const resolved   = controvs.filter(c => c.isResolved).length
  const unresolved = controvs.filter(c => !c.isResolved).length
  const resolutionData = [
    { name: "Resolved",   value: resolved,   color: C.kept   },
    { name: "Unresolved", value: unresolved, color: C.broken },
  ].filter(d => d.value > 0)

  // ── Promise fulfillment rate ──────────────────────────────────────────────────
  const totalPromises = promiseDonut.reduce((s, d) => s + d.value, 0)
  const keptCount     = promiseMeta?.byStatus?.KEPT ?? 0
  const keepRate      = totalPromises > 0 ? Math.round((keptCount / totalPromises) * 100) : 0

  return (
    <PageTransition className="max-w-7xl mx-auto px-4 md:px-8 py-10 flex flex-col gap-14 w-full">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <span className="text-sm font-semibold tracking-wider uppercase text-primary">
              Live Data
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight">
            Analytics Dashboard
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Comprehensive visualisation of RSP&apos;s legislative record, promise fulfilment,
            MP performance, and accountability data.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card border border-border px-3 py-1.5 rounded-md w-fit group relative cursor-help self-start md:self-auto">
          <Info className="w-4 h-4" />
          <span>parliament.gov.np · rspnepal.org</span>
          <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bottom-full mb-2 right-0 bg-popover text-popover-foreground text-xs p-3 rounded-md shadow-md border border-border w-72 pointer-events-none z-10">
            Data aggregated from official parliamentary records, bill registries, RSP press channels,
            and public statements. Updated regularly.
          </div>
        </div>
      </motion.div>

      {/* ── Key metrics ─────────────────────────────────────────────────────── */}
      <Section delay={0.05}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Days in Power"
            value={stats ? String(stats.daysInPower) : "—"}
            trend={{ value: "since March 2026", positive: true }}
          />
          <StatCard
            label="Laws Filed"
            value={stats ? String(stats.lawsPassed) : "—"}
            trend={{ value: "passed or enacted", positive: true }}
          />
          <StatCard
            label="Active MPs"
            value={stats ? String(stats.activeMps) : "—"}
            trend={{ value: "tracked members", positive: true }}
          />
          <StatCard
            label="Total Votes"
            value={stats ? String(stats.totalVotes) : "—"}
            trend={{ value: "parliamentary votes", positive: true }}
          />
          <StatCard
            label="Promises"
            value={stats ? String(stats.promisesTracked) : "—"}
            trend={{ value: "from Citizen Contract", positive: true }}
          />
          <StatCard
            label="Kept Rate"
            value={anyLoading ? "—" : `${keepRate}%`}
            trend={{ value: `${keptCount} of ${totalPromises} kept`, positive: keepRate >= 50 }}
          />
        </div>
      </Section>

      {/* ── Promise Fulfilment ──────────────────────────────────────────────── */}
      <Section>
        <div className="flex flex-col gap-6">
          <SectionHeading
            icon={CheckCircle2}
            title="Promise Fulfilment"
            subtitle="How RSP is delivering on its Citizen Contract commitments."
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Donut */}
            <ChartCard
              title="Overall Status Breakdown"
              subtitle="Distribution of all tracked promises by current status."
              height={300}
            >
              {mounted && promiseDonut.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={promiseDonut}
                      cx="50%"
                      cy="50%"
                      innerRadius="55%"
                      outerRadius="75%"
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {promiseDonut.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip {...TT} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : <ChartSkeleton height={300} />}
            </ChartCard>

            {/* Status bars with rates */}
            <div className="bg-card border border-border rounded-md p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-display font-semibold">Status at a Glance</h3>
                <p className="text-xs text-muted-foreground">Progress bars per fulfilment category.</p>
              </div>
              <div className="flex flex-col gap-5 justify-center flex-1">
                {[
                  { label: "Kept",        key: "KEPT",        color: C.kept       },
                  { label: "In Progress", key: "IN_PROGRESS", color: C.inProgress },
                  { label: "Not Started", key: "NOT_STARTED", color: C.notStarted },
                  { label: "Broken",      key: "BROKEN",      color: C.broken     },
                ].map(({ label, key, color }) => {
                  const count = promiseMeta?.byStatus?.[key] ?? 0
                  const pct   = totalPromises > 0 ? (count / totalPromises) * 100 : 0
                  return (
                    <div key={key} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">{label}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {l2 ? "—" : `${count} · ${Math.round(pct)}%`}
                        </span>
                      </div>
                      <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: color }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Category × Status line chart */}
          <ChartCard
            title="Promises by Category & Status"
            subtitle="Line breakdown of all tracked promises grouped by policy area."
            height={380}
          >
            {mounted && promiseCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={promiseCategoryData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "currentColor", opacity: 0.6, fontSize: 12 }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "currentColor", opacity: 0.6, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <RechartsTooltip {...TT} />
                  <Legend wrapperStyle={{ paddingTop: "16px", fontSize: "12px" }} iconType="circle" iconSize={8} />
                  {[
                    { key: "Kept",        color: C.kept       },
                    { key: "In Progress", color: C.inProgress },
                    { key: "Not Started", color: C.notStarted },
                    { key: "Broken",      color: C.broken     },
                  ].map(({ key, color }) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={color}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: color, strokeWidth: 0 }}
                      activeDot={{ r: 7, fill: color, strokeWidth: 0 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : <ChartSkeleton height={380} />}
          </ChartCard>
        </div>
      </Section>

      {/* ── Legislative Pipeline ────────────────────────────────────────────── */}
      <Section>
        <div className="flex flex-col gap-6">
          <SectionHeading
            icon={Scale}
            title="Legislative Pipeline"
            subtitle="Tracking bills and laws through every stage of the parliamentary process."
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Laws by Status */}
            <ChartCard
              title="Laws by Status"
              subtitle="How many bills are at each stage of the legislative lifecycle."
              height={300}
            >
              {mounted && lawStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lawStatusData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "currentColor", opacity: 0.6, fontSize: 12 }}
                      axisLine={{ stroke: "var(--border)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "currentColor", opacity: 0.6, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <RechartsTooltip {...TT} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
                    <Bar dataKey="value" name="Laws" radius={[4, 4, 0, 0]}>
                      {lawStatusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <ChartSkeleton height={300} />}
            </ChartCard>

            {/* Laws by Category — horizontal */}
            <ChartCard
              title="Laws by Category"
              subtitle="Top policy areas covered by filed legislation."
              height={300}
            >
              {mounted && lawCatData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={lawCatData}
                    layout="vertical"
                    margin={{ top: 4, right: 24, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: "currentColor", opacity: 0.6, fontSize: 12 }}
                      axisLine={{ stroke: "var(--border)" }}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={90}
                      tick={{ fill: "currentColor", opacity: 0.7, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip {...TT} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
                    <Bar dataKey="value" name="Laws" fill="var(--primary)" radius={[0, 4, 4, 0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <ChartSkeleton height={300} />}
            </ChartCard>
          </div>
        </div>
      </Section>

      {/* ── Parliamentary Votes ─────────────────────────────────────────────── */}
      <Section>
        <div className="flex flex-col gap-6">
          <SectionHeading
            icon={TrendingUp}
            title="Parliamentary Votes"
            subtitle="Outcomes, vote types, and RSP member alignment across all recorded votes."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Vote Outcomes donut */}
            <ChartCard title="Vote Outcomes" subtitle="Passed vs defeated across all votes." height={260}>
              {mounted && voteOutcomeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={voteOutcomeData}
                      cx="50%"
                      cy="50%"
                      innerRadius="50%"
                      outerRadius="70%"
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {voteOutcomeData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip {...TT} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <ChartSkeleton height={260} />}
            </ChartCard>

            {/* Vote Types donut */}
            <ChartCard title="Vote Types" subtitle="Final passage, amendments, and procedurals." height={260}>
              {mounted && voteTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={voteTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius="50%"
                      outerRadius="70%"
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {voteTypeData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip {...TT} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <ChartSkeleton height={260} />}
            </ChartCard>

            {/* Aggregate member vote alignment */}
            <ChartCard title="Member Alignment" subtitle="Aggregate YEA / NAY / ABSTAIN / ABSENT across all votes." height={260}>
              {mounted && voteAlignData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={voteAlignData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "currentColor", opacity: 0.6, fontSize: 12 }}
                      axisLine={{ stroke: "var(--border)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "currentColor", opacity: 0.6, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <RechartsTooltip {...TT} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
                    <Bar dataKey="value" name="Votes" radius={[4, 4, 0, 0]}>
                      {voteAlignData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <ChartSkeleton height={260} />}
            </ChartCard>
          </div>
        </div>
      </Section>

      {/* ── MP Distribution ────────────────────────────────────────────────── */}
      <Section>
        <div className="flex flex-col gap-6">
          <SectionHeading
            icon={Users}
            title="MP Distribution"
            subtitle="RSP membership spread across Nepal's provinces and attendance performance."
          />

          {/* Province cards */}
          {provinceData.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {provinceData.map(({ name, count }, idx) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05, duration: 0.35 }}
                  className="bg-card border border-border p-5 rounded-md flex flex-col gap-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold">{name}</h3>
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-display font-bold text-primary tabular-nums">{count}</span>
                    <span className="text-sm text-muted-foreground mb-1">MP{count !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="pt-3 border-t border-border">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Share of total</span>
                        <span className="font-medium text-foreground">
                          {members.length > 0 ? Math.round((count / members.length) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${members.length > 0 ? (count / members.length) * 100 : 0}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.7, ease: "easeOut", delay: idx * 0.04 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="bg-card border border-border p-5 rounded-md flex flex-col gap-4 animate-pulse">
                  <div className="flex justify-between"><div className="h-4 bg-muted rounded w-20" /><div className="w-4 h-4 bg-muted rounded" /></div>
                  <div className="flex items-end gap-2"><div className="h-8 bg-muted rounded w-8" /><div className="h-4 bg-muted rounded w-8 mb-1" /></div>
                  <div className="pt-3 border-t border-border"><div className="h-2 bg-muted rounded-full w-full" /></div>
                </div>
              ))}
            </div>
          )}

          {/* Attendance histogram */}
          <ChartCard
            title="Attendance Distribution"
            subtitle="Number of MPs falling into each attendance percentage range."
            height={260}
          >
            {mounted && attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "currentColor", opacity: 0.6, fontSize: 12 }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "currentColor", opacity: 0.6, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    label={{ value: "MPs", angle: -90, position: "insideLeft", offset: 10, style: { fill: "var(--muted-foreground)", fontSize: 11 } }}
                  />
                  <RechartsTooltip {...TT} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
                  <Bar dataKey="count" name="MPs" fill="var(--primary)" radius={[4, 4, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            ) : <ChartSkeleton height={260} />}
          </ChartCard>
        </div>
      </Section>

      {/* ── Accountability ────────────────────────────────────────────────── */}
      <Section>
        <div className="flex flex-col gap-6">
          <SectionHeading
            icon={AlertTriangle}
            title="Accountability Tracker"
            subtitle="Flagged controversies by severity level and resolution status."
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Severity distribution */}
            <ChartCard
              title="Controversies by Severity"
              subtitle="How many flagged issues fall into each severity tier."
              height={280}
            >
              {mounted && severityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={severityData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "currentColor", opacity: 0.6, fontSize: 12 }}
                      axisLine={{ stroke: "var(--border)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "currentColor", opacity: 0.6, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <RechartsTooltip {...TT} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
                    <Bar dataKey="value" name="Controversies" radius={[4, 4, 0, 0]}>
                      {severityData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <ChartSkeleton height={280} />}
            </ChartCard>

            {/* Resolution status */}
            <ChartCard
              title="Resolution Status"
              subtitle="Resolved vs unresolved controversies."
              height={280}
            >
              {mounted && resolutionData.length > 0 ? (
                <div className="h-full flex flex-col justify-center gap-6">
                  {/* Donut in the center */}
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={resolutionData}
                        cx="50%"
                        cy="50%"
                        innerRadius="50%"
                        outerRadius="68%"
                        paddingAngle={4}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {resolutionData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip {...TT} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Summary text */}
                  <div className="flex justify-center gap-8 text-sm">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-2xl font-display font-bold text-[#16a34a] tabular-nums">{resolved}</span>
                      <span className="text-muted-foreground text-xs">Resolved</span>
                    </div>
                    <div className="w-px bg-border" />
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-2xl font-display font-bold text-[#dc2626] tabular-nums">{unresolved}</span>
                      <span className="text-muted-foreground text-xs">Unresolved</span>
                    </div>
                    <div className="w-px bg-border" />
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-2xl font-display font-bold tabular-nums">
                        {controvs.length > 0 ? Math.round((resolved / controvs.length) * 100) : 0}%
                      </span>
                      <span className="text-muted-foreground text-xs">Resolution rate</span>
                    </div>
                  </div>
                </div>
              ) : <ChartSkeleton height={280} />}
            </ChartCard>
          </div>
        </div>
      </Section>

      {/* ── Footer note ────────────────────────────────────────────────────── */}
      <Section>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Activity className="w-3.5 h-3.5" />
          Data sourced from parliament.gov.np, rspnepal.org, and RSP official channels.
          Figures reflect publicly available records and are updated continuously.
        </div>
      </Section>

    </PageTransition>
  )
}
