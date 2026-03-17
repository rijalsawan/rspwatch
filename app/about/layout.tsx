import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About",
  description:
    "Parliament Watch is a non-partisan, open-source project tracking all political parties' parliamentary records through transparent, verified public data.",
  openGraph: {
    title: "About Parliament Watch",
    description:
      "A non-partisan, open-source project tracking all political parties' parliamentary records through transparent, verified public data.",
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
