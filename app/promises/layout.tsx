import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Promise Tracker",
  description:
    "Is RSP keeping its promises? Track the status of every Citizen Contract pledge — kept, in progress, broken, or not started.",
  openGraph: {
    title: "RSP Promise Tracker | RSP Watch",
    description:
      "Track the status of every RSP Citizen Contract pledge — kept, in progress, broken, or not started.",
  },
}

export default function PromisesLayout({ children }: { children: React.ReactNode }) {
  return children
}
