import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Press & News",
  description:
    "Official press releases, announcements, and news from RSP leadership. Live-synced from rspnepal.org.",
  openGraph: {
    title: "Press & News | RSP Watch",
    description:
      "Official press releases, announcements, and news from RSP leadership. Live-synced from rspnepal.org.",
  },
}

export default function PressLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
