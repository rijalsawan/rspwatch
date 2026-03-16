"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
} from "recharts"
import { StatCard } from "@/components/shared/StatCard"
import { Info, Users } from "lucide-react"

interface StatsData {
  activeMps: number
  lawsPassed: number
  promisesTracked: number
  promisesKept: number
}

interface PromiseMeta {
  byStatus: Record<string, number>
  byCategory: Record<string, Record<string, number>>
}

interface MemberItem {
  province: string
}

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [promiseMeta, setPromiseMeta] = useState<PromiseMeta | null>(null)
  const [members, setMembers] = useState<MemberItem[]>([])

  useEffect(() => {
    setMounted(true)
    Promise.all([
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/promises?limit=50").then((r) => r.json()),
      fetch("/api/members?limit=100").then((r) => r.json()),
    ]).then(([statsJson, promisesJson, membersJson]) => {
      if (statsJson.data) setStats(statsJson.data)
      if (promisesJson.meta) setPromiseMeta(promisesJson.meta as PromiseMeta)
      if (membersJson.data) setMembers(membersJson.data as MemberItem[])
    })
  }, [])

  // Derive stacked bar chart data: one row per category, columns per status
  const promiseCategoryData = promiseMeta?.byCategory
    ? Object.entries(promiseMeta.byCategory).map(([name, statusCounts]) => ({
        name,
        Kept: statusCounts.KEPT ?? 0,
        "In Progress": statusCounts.IN_PROGRESS ?? 0,
        Broken: statusCounts.BROKEN ?? 0,
        "Not Started": statusCounts.NOT_STARTED ?? 0,
      }))
    : []

  // Derive real province distribution from member data
  const provinceMap: Record<string, number> = {}
  for (const m of members) {
    if (m.province) provinceMap[m.province] = (provinceMap[m.province] ?? 0) + 1
  }
  const provinceData = Object.entries(provinceMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-12 flex flex-col gap-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-display font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            A comprehensive overview of RSP&apos;s performance through data, promise tracking, and MP distribution.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary px-3 py-1.5 rounded-md border border-border w-fit group relative cursor-help">
          <Info className="w-4 h-4" />
          <span>Source: parliament.gov.np</span>
          <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bottom-full mb-2 right-0 md:left-auto left-0 bg-popover text-popover-foreground text-xs p-3 rounded-md shadow-md border border-border w-64 pointer-events-none z-10">
            Data aggregated from official parliamentary records, bill registries, and public statements. Updated regularly.
          </div>
        </div>
      </div>

      {/* Top Stats from real API */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Total Promises Tracked"
          value={stats ? String(stats.promisesTracked) : "—"}
          trend={{ value: "From RSP Citizen Contract", positive: true }}
        />
        <StatCard
          label="Promises Kept"
          value={stats ? String(stats.promisesKept) : "—"}
          trend={{ value: promiseMeta ? `${Object.values(promiseMeta.byStatus).reduce((a, b) => a + b, 0)} total tracked` : "loading…", positive: true }}
        />
        <StatCard
          label="Active MPs"
          value={stats ? String(stats.activeMps) : "—"}
          trend={{ value: `${stats?.lawsPassed ?? "—"} laws filed`, positive: true }}
        />
      </div>

      {/* Line chart: Promises by Category & Status */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card text-card-foreground border border-border rounded-md p-6 flex flex-col gap-6"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-display font-semibold">Promises by Category & Status</h2>
          <p className="text-sm text-muted-foreground">
            Live breakdown of all tracked promises grouped by policy area and fulfilment status.
          </p>
        </div>

        <div className="h-[400px] w-full">
          {mounted && promiseCategoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={promiseCategoryData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "currentColor", opacity: 0.6, fontSize: 12 }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={{ stroke: "var(--border)" }}
                />
                <YAxis
                  tick={{ fill: "currentColor", opacity: 0.6, fontSize: 12 }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={{ stroke: "var(--border)" }}
                  allowDecimals={false}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                  itemStyle={{ color: "var(--foreground)" }}
                  cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                />
                <Legend wrapperStyle={{ paddingTop: "16px" }} />
                <Line
                  type="monotone"
                  dataKey="Kept"
                  stroke="#16a34a"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#16a34a", strokeWidth: 0 }}
                  activeDot={{ r: 8, fill: "#16a34a", strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="In Progress"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#f59e0b", strokeWidth: 0 }}
                  activeDot={{ r: 8, fill: "#f59e0b", strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="Not Started"
                  stroke="#64748b"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#64748b", strokeWidth: 0 }}
                  activeDot={{ r: 8, fill: "#64748b", strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="Broken"
                  stroke="#dc2626"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#dc2626", strokeWidth: 0 }}
                  activeDot={{ r: 8, fill: "#dc2626", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm animate-pulse">
              Loading chart…
            </div>
          )}
        </div>
      </motion.section>

      {/* RSP MPs by Province — real member data */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-display font-semibold">RSP MPs by Province</h2>
          <p className="text-sm text-muted-foreground">
            Distribution of tracked RSP members across Nepal&apos;s 7 provinces.
          </p>
        </div>

        {provinceData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {provinceData.map(({ name, count }) => (
              <div
                key={name}
                className="bg-card text-card-foreground border border-border p-5 rounded-md flex flex-col gap-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">{name}</h3>
                  <Users className="w-4 h-4 text-muted-foreground" />
                </div>

                <div className="flex items-end gap-2">
                  <span className="text-3xl font-display font-bold text-primary tabular-nums">
                    {count}
                  </span>
                  <span className="text-sm text-muted-foreground mb-1">MP{count !== 1 ? "s" : ""}</span>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-border mt-auto">
                  <div className="flex flex-col gap-1 w-full">
                    <span className="text-xs text-muted-foreground flex justify-between">
                      <span>Share of tracked MPs</span>
                      <span className="font-medium text-foreground">
                        {members.length > 0 ? Math.round((count / members.length) * 100) : 0}%
                      </span>
                    </span>
                    <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${members.length > 0 ? (count / members.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border p-5 rounded-md h-40 animate-pulse" />
            ))}
          </div>
        )}
      </motion.section>
    </main>
  )
}
