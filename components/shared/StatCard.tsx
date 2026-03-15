interface StatCardProps {
  label: string
  value: string | number
  trend?: {
    value: string
    positive: boolean
  }
}

export function StatCard({ label, value, trend }: StatCardProps) {
  return (
    <div className="bg-card text-card-foreground border border-border p-6 rounded-md flex flex-col gap-2">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </h3>
      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-display font-bold tabular-nums">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-semibold ${
              trend.positive ? "text-success" : "text-destructive"
            }`}
          >
            {trend.positive ? "+" : ""}
            {trend.value}
          </span>
        )}
      </div>
    </div>
  )
}
