import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Public Statements",
  description: "Official press releases, speeches, and statements made by parliamentary members and party leadership.",
  openGraph: {
    title: "Public Statements | Parliament Watch",
    description: "Official press releases and statements by parliamentary members and party leadership.",
  },
}

export default function StatementsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
