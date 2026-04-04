import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Parliament Activity",
  description:
    "Track parliamentary activity: bills introduced, votes held, and government appointments.",
  openGraph: {
    title: "Parliament Activity | Parliament Watch",
    description:
      "Track parliamentary activity: bills introduced, votes held, and government appointments.",
  },
}

export default function ParliamentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
