import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Parliamentary Votes",
  description:
    "See how Nepal's MPs voted on every bill — yea, nay, abstain, or absent. Track party-line votes and defections.",
  openGraph: {
    title: "Parliamentary Votes | Parliament Watch",
    description:
      "See how Nepal's MPs voted on every bill — track party-line votes and defections.",
  },
}

export default function VotesLayout({ children }: { children: React.ReactNode }) {
  return children
}
