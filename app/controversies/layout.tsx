import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Controversies",
  description: "Documented controversies, ethics violations, and disputes involving RSP members — tracked with full transparency.",
  openGraph: {
    title: "Controversies | RSP Watch",
    description: "Documented controversies and ethics issues involving RSP members, tracked transparently.",
  },
}

export default function ControversiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
