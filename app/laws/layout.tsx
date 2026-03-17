import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Laws & Bills",
  description:
    "Browse bills proposed, passed, and enacted in Nepal's federal parliament. Filter by status, category, and sponsor.",
  openGraph: {
    title: "Laws & Bills | Parliament Watch",
    description:
      "Browse bills proposed, passed, and enacted in Nepal's federal parliament.",
  },
}

export default function LawsLayout({ children }: { children: React.ReactNode }) {
  return children
}
