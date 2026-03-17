import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Events & Gatherings",
  description:
    "Official political party events, rallies, and meetings.",
  openGraph: {
    title: "Events & Gatherings | Parliament Watch",
    description:
      "Official political party events, rallies, and meetings.",
  },
}

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
