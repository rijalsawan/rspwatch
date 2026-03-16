import { cn } from "@/lib/utils"

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export function SkeletonRow() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 border border-border bg-card rounded-md min-h-[160px] sm:min-h-[116px]">
      <div className="flex flex-col gap-3 flex-1 w-full max-w-2xl">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-6 w-3/4 max-w-md" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-4 sm:pt-0 border-t border-border sm:border-0 w-full sm:w-auto mt-auto sm:mt-0">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-24 rounded-sm" />
      </div>
    </div>
  )
}
