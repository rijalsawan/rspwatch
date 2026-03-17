import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search across MPs, laws, bills, promises, statements, and more on Parliament Watch.",
  openGraph: {
    title: "Search | Parliament Watch",
    description:
      "Search across MPs, laws, bills, promises, statements, and more on Parliament Watch.",
  },
}

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
