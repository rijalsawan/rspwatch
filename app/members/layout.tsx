import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "RSP Members of Parliament",
  description:
    "Directory of all 34 Rastriya Swatantra Party MPs — attendance records, voting history, sponsored bills, and constituency details.",
  openGraph: {
    title: "RSP Members of Parliament | RSP Watch",
    description:
      "Directory of all 34 Rastriya Swatantra Party MPs — attendance records, voting history, and constituency details.",
  },
}

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return children
}
