import { BadgeCheck, Database, PenSquare } from "lucide-react"

export type ConfidenceLevel = "VERIFIED" | "SCRAPED" | "MANUAL"

const CONFIG: Record<ConfidenceLevel, {
  label: string
  Icon: React.ElementType
  text: string
  bg: string
  border: string
}> = {
  VERIFIED: {
    label: "Verified",
    Icon: BadgeCheck,
    text: "#16a34a",
    bg: "rgba(22,163,74,0.1)",
    border: "rgba(22,163,74,0.25)",
  },
  SCRAPED: {
    label: "Scraped",
    Icon: Database,
    text: "#60a5fa",
    bg: "rgba(96,165,250,0.1)",
    border: "rgba(96,165,250,0.25)",
  },
  MANUAL: {
    label: "Manual",
    Icon: PenSquare,
    text: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.25)",
  },
}

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel
  showLabel?: boolean
}

export function ConfidenceBadge({ confidence, showLabel = true }: ConfidenceBadgeProps) {
  const cfg = CONFIG[confidence]
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border"
      style={{
        color: cfg.text,
        backgroundColor: cfg.bg,
        borderColor: cfg.border,
      }}
      title={`Data confidence: ${cfg.label}`}
    >
      <cfg.Icon className="w-3 h-3" />
      {showLabel && cfg.label}
    </span>
  )
}
