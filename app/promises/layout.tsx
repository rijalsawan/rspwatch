import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Promise Tracker",
  description:
    "Track the status of all political party election promises — kept, in progress, broken, or not started.",
  openGraph: {
    title: "Promise Tracker | Parliament Watch",
    description:
      "Track the status of all political party election promises — kept, in progress, broken, or not started.",
  },
}

export default function PromisesLayout({ children }: { children: React.ReactNode }) {
  return children
}
