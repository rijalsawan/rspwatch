import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Manifesto Tracker",
  description:
    "Track political parties' progress on their official manifesto commitments and election promises. Every pledge monitored and scored.",
  openGraph: {
    title: "Manifesto Tracker | Parliament Watch",
    description:
      "Track political parties' progress on their official manifesto commitments and election promises. Every pledge monitored and scored.",
  },
}

export default function ManifestoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
