import { cn } from "@/lib/utils"

export type StatusType = 
  | "success" 
  | "warning" 
  | "destructive" 
  | "neutral" 
  | "primary" 
  | "pending" 
  | "passed" 
  | "rejected" 
  | "kept" 
  | "broken" 
  | "in-progress"

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType
  pulse?: boolean
}

export function StatusBadge({ status, pulse, className, children, ...props }: StatusBadgeProps) {
  const isSuccess = ["success", "passed", "kept"].includes(status)
  const isWarning = ["warning", "pending", "in-progress"].includes(status)
  const isDestructive = ["destructive", "rejected", "broken"].includes(status)
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-xs font-semibold uppercase tracking-wide",
        isSuccess && "bg-success/10 text-success border border-success/20",
        isWarning && "bg-warning/10 text-warning border border-warning/20",
        isDestructive && "bg-destructive/10 text-destructive border border-destructive/20",
        status === "primary" && "bg-primary/10 text-primary border border-primary/20",
        status === "neutral" && "bg-muted text-muted-foreground border border-border",
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
            isSuccess && "bg-success",
            isWarning && "bg-warning",
            isDestructive && "bg-destructive",
            status === "primary" && "bg-primary"
          )} />
          <span className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            isSuccess && "bg-success",
            isWarning && "bg-warning",
            isDestructive && "bg-destructive",
            status === "primary" && "bg-primary"
          )} />
        </span>
      )}
      {children}
    </span>
  )
}
