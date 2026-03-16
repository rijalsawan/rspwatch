import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Analytics | RSP Watch",
  description: "Visualizations and analytics of RSP's performance, promises kept, and provincial scorecards.",
  openGraph: {
    title: "Analytics | RSP Watch",
    description: "Visualizations and analytics of RSP's performance, promises kept, and provincial scorecards.",
  },
}

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children
}