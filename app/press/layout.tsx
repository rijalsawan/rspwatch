import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Press & News",
  description:
    "Official press releases, announcements, and news from political leaders and organizations.",
  openGraph: {
    title: "Press & News | Parliament Watch",
    description:
      "Official press releases, announcements, and news from political leaders and organizations.",
  },
}

export default function PressLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
