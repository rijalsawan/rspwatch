import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Members of Parliament",
  description:
    "Directory of Nepal's parliamentary members — attendance records, voting history, sponsored bills, and constituency details.",
  openGraph: {
    title: "Members of Parliament | Parliament Watch",
    description:
      "Directory of Nepal's parliamentary members — attendance records, voting history, and constituency details.",
  },
}

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return children
}
