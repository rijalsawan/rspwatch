import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About",
  description:
    "RSP Watch is a non-partisan, open-source project tracking Rastriya Swatantra Party's parliamentary record through transparent, verified public data.",
  openGraph: {
    title: "About RSP Watch",
    description:
      "A non-partisan, open-source project tracking RSP's parliamentary record through transparent, verified public data.",
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
