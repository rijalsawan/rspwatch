import { Type, CheckCircle2, Clock, XCircle, CircleDashed, ExternalLink } from "lucide-react"
import { StatusBadge, type StatusType } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"

export type PromiseStatus = "kept" | "in-progress" | "broken" | "not-started"

interface PromiseCardProps {
  id: string
  title: string
  description: string
  category: string
  status: PromiseStatus
  source: string
  timeline?: string
  evidenceTarget?: string
}

export function PromiseCard({
  title,
  description,
  category,
  status,
  source,
  timeline,
  evidenceTarget,
}: PromiseCardProps) {
  // Map our domain statuses to the shared badge statuses
  const badgeStatusMap: Record<PromiseStatus, StatusType> = {
    "kept": "success",
    "in-progress": "warning",
    "broken": "destructive",
    "not-started": "neutral",
  }

  // Pick an icon based on status
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
    "not-started": "Not Started"
  }[status]

  return (
    <div className="flex flex-col bg-card border border-border rounded-md hover:border-primary/50 transition-colors h-full">
      <div className="p-5 md:p-6 flex flex-col flex-1 gap-4">
        {/* Header: Category & Status */}
        <div className="flex items-center justify-between gap-2 border-b border-border pb-4">
          <StatusBadge status="neutral">{category}</StatusBadge>
          <div className="flex items-center gap-1.5">
            <StatusIcon className={`w-4 h-4 ${
              status === 'kept' ? 'text-success' :
              status === 'in-progress' ? 'text-warning' :
              status === 'broken' ? 'text-destructive' : 'text-muted-foreground'
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
        <div className="flex flex-col gap-1 mt-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-sm">
          <div className="flex justify-between items-center gap-2">
            <span className="font-semibold text-foreground">Source:</span>
            <span className="truncate">{source}</span>
          </div>
          {timeline && (
            <div className="flex justify-between items-center gap-2">
              <span className="font-semibold text-foreground">Target Timeline:</span>
              <span>{timeline}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer / Action */}
      <div className="p-4 bg-muted/30 border-t border-border mt-auto flex items-center justify-between rounded-b-md">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          ID: PRM-{Math.floor(Math.random() * 1000).toString().padStart(3, '0')}
        </span>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-primary hover:text-primary">
          View Evidence <ExternalLink className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
