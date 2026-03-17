import { CheckCircle2, Clock, XCircle, CircleDashed, ExternalLink, Github } from "lucide-react"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ConfidenceBadge, type ConfidenceLevel } from "@/components/shared/ConfidenceBadge"
import { Button } from "@/components/ui/button"

export type PromiseStatus = "kept" | "in-progress" | "broken" | "not-started"

const SOURCE_LABELS: Record<string, string> = {
  MANIFESTO: "Election Manifesto",
  CITIZEN_CONTRACT: "Citizen Contract (नागरिक करार)",
  SPEECH: "Public Speech",
  POLICY_BRIEF: "Policy Brief",
}

interface PromiseCardProps {
  id: string
  slug: string
  title: string
  description: string
  category: string
  status: PromiseStatus
  source: string
  confidence?: ConfidenceLevel
  timeline?: string
  evidenceUrl?: string
}

export function PromiseCard({
  slug,
  title,
  description,
  category,
  status,
  source,
  confidence,
  timeline,
  evidenceUrl,
}: PromiseCardProps) {
  const StatusIcon = {
    "kept": CheckCircle2,
    "in-progress": Clock,
    "broken": XCircle,
    "not-started": CircleDashed,
  }[status]

  const statusLabel = {
    "kept": "Kept",
    "in-progress": "In Progress",
    "broken": "Broken",
    "not-started": "Not Started",
  }[status]

  const githubUrl =
    `https://github.com/rijalsawan/rspwatch/issues/new` +
    `?title=${encodeURIComponent(`Data Update: "${title}"`)}&labels=data-update` +
    `&body=${encodeURIComponent(`Promise slug: ${slug}\n\nWhat needs updating:\n`)}`

  return (
    <div className="flex flex-col bg-card border border-border rounded-md hover:border-primary/50 transition-colors h-full">
      <div className="p-5 md:p-6 flex flex-col flex-1 gap-4">
        {/* Header: Category, Confidence & Status */}
        <div className="flex items-center justify-between gap-2 border-b border-border pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status="neutral">{category}</StatusBadge>
            {confidence && <ConfidenceBadge confidence={confidence} showLabel={false} />}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <StatusIcon className={`w-4 h-4 ${
              status === "kept" ? "text-success" :
              status === "in-progress" ? "text-warning" :
              status === "broken" ? "text-destructive" : "text-muted-foreground"
            }`} />
            <span className="text-xs font-bold uppercase tracking-wide text-foreground">
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 flex-1">
          <h3 className="text-lg font-semibold font-display leading-tight">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {/* Metadata */}
        <div className="flex flex-col gap-1 text-xs text-muted-foreground bg-muted/50 p-3 rounded-sm">
          <div className="flex justify-between items-center gap-2">
            <span className="font-semibold text-foreground">Source:</span>
            <span className="truncate relative group cursor-help">
              <span className="underline decoration-dotted">
                {SOURCE_LABELS[source] ?? source}
              </span>
            </span>
          </div>
          {timeline && (
            <div className="flex justify-between items-center gap-2">
              <span className="font-semibold text-foreground">Target Timeline:</span>
              <span>{timeline}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-muted/30 border-t border-border mt-auto flex items-center justify-between rounded-b-md gap-2">
        <span className="text-xs font-mono text-muted-foreground/60 shrink-0">
          {slug}
        </span>
        <div className="flex items-center gap-1">
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 px-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground rounded-sm hover:bg-muted transition-colors"
          >
            <Github className="w-3.5 h-3.5" /> Suggest Update
          </a>
          {evidenceUrl && (
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-primary hover:text-primary" asChild>
              <a href={evidenceUrl} target="_blank" rel="noopener noreferrer">
                Evidence <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
