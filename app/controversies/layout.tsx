import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Controversies",
  description: "Documented controversies, ethics violations, and disputes involving parliamentary members — tracked with full transparency.",
  openGraph: {
    title: "Controversies | Parliament Watch",
    description: "Documented controversies and ethics issues involving parliamentary members, tracked transparently.",
  },
}

export default function ControversiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
