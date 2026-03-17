import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Transparency & Data Sources",
  description:
    "How RSP Watch collects, verifies, and integrates data. Full audit trail of all data sources and scraping activity.",
  openGraph: {
    title: "Transparency & Data Sources | RSP Watch",
    description:
      "How RSP Watch collects, verifies, and integrates data. Full audit trail of all data sources and scraping activity.",
  },
}

export default function TransparencyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
