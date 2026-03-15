import Link from "next/link"
import { User, MapPin, Briefcase } from "lucide-react"

export interface MemberCardProps {
  id: string
  name: string
  role: string
  constituency: string
  province: string
  attendance?: number
}

export function MemberCard({
  id,
  name,
  role,
  constituency,
  province,
  attendance,
}: MemberCardProps) {
  const isMinister = role.toLowerCase().includes("minister") || role.toLowerCase().includes("prime")
  
  return (
    <Link 
      href={`/members/${id}`}
      className="flex flex-col bg-card border border-border rounded-md hover:border-primary/50 transition-colors group outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="p-5 flex flex-col items-center text-center gap-4 border-b border-border bg-muted/20">
        {/* Avatar Placeholder */}
        <div className="w-20 h-20 rounded-full bg-secondary border-2 border-border flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-colors overflow-hidden">
          <User className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        
        {/* Name and Role */}
        <div>
          <h3 className="text-lg font-bold font-display group-hover:text-primary transition-colors">
            {name}
          </h3>
          <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm mt-2 inline-block ${
            isMinister ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          }`}>
            {role}
          </span>
        </div>
      </div>

      {/* Metadata */}
      <div className="p-4 flex flex-col gap-3 text-sm flex-1">
        <div className="flex items-start gap-2.5 text-muted-foreground">
          <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex flex-col text-left">
            <span className="font-medium text-foreground">{constituency}</span>
            <span className="text-xs">{province}</span>
          </div>
        </div>

        {attendance !== undefined && (
          <div className="flex items-center gap-2.5 text-muted-foreground mt-auto pt-3 border-t border-border">
            <Briefcase className="w-4 h-4 shrink-0" />
            <div className="flex w-full items-center justify-between">
              <span className="text-xs">Parliament Attendance</span>
              <span className={`text-xs font-bold ${
                attendance >= 90 ? 'text-success' : 
                attendance >= 75 ? 'text-warning' : 'text-destructive'
              }`}>
                {attendance}%
              </span>
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
