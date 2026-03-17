import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Public Forum & Debates",
  description: "Join the conversation on Nepal's politics, laws, and controversies.",
}

export default function DiscussionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
