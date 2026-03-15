import Link from "next/link"
import { StatusBadge, type StatusType } from "./StatusBadge"

interface ActivityFeedItemProps {
  date: string
  title: string
  description: string
  category: string
  status: StatusType
  href: string
  isLast?: boolean
}

export function ActivityFeedItem({
  date,
  title,
  description,
  category,
  status,
  href,
  isLast,
}: ActivityFeedItemProps) {
  return (
    <div className="relative pl-6 pb-8">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-1.5 top-2 bottom-0 w-px bg-border translate-x-[-0.5px]" />
      )}
      
      {/* Timeline Dot */}
      <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
      
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-xs">
          <time className="text-muted-foreground font-medium">{date}</time>
          <StatusBadge status={status}>{category}</StatusBadge>
        </div>
        
        <Link 
          href={href}
          className="group block outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          <h4 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
            {title}
          </h4>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </Link>
      </div>
    </div>
  )
}
