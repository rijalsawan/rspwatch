import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Activity Timeline",
  description:
    "Chronological feed of all parliamentary activity — new bills, votes, statements, promise updates, and more.",
  openGraph: {
    title: "Activity Timeline | Parliament Watch",
    description:
      "Chronological feed of all parliamentary activity — bills, votes, statements, and more.",
  },
}

export default function TimelineLayout({ children }: { children: React.ReactNode }) {
  return children
}
