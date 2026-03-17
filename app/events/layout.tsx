import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Events & Gatherings",
  description:
    "Official RSP party events, rallies, and meetings — synced live from rspnepal.org.",
  openGraph: {
    title: "Events & Gatherings | RSP Watch",
    description:
      "Official RSP party events, rallies, and meetings — synced live from rspnepal.org.",
  },
}

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
