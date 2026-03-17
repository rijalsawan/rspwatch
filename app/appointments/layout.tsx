import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Appointments & Cabinet",
  description: "Track parliamentary members serving in Nepal's cabinet, parliamentary committees, and key structural government roles.",
  openGraph: {
    title: "Appointments & Cabinet | Parliament Watch",
    description: "Track members in Nepal's cabinet, parliamentary committees, and government roles.",
  },
}

export default function AppointmentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
