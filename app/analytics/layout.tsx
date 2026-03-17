import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Analytics | Parliament Watch",
  description: "Visualizations and analytics of political parties' performance, promises kept, and provincial scorecards.",
  openGraph: {
    title: "Analytics | Parliament Watch",
    description: "Visualizations and analytics of political parties' performance, promises kept, and provincial scorecards.",
  },
}

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children
}