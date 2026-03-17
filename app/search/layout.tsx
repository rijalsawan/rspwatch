import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search across MPs, laws, bills, promises, statements, and more on RSP Watch.",
  openGraph: {
    title: "Search | RSP Watch",
    description:
      "Search across MPs, laws, bills, promises, statements, and more on RSP Watch.",
  },
}

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
