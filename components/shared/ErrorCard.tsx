"use client"

import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ErrorCardProps {
  title?: string
  message?: string
  className?: string
}

export function ErrorCard({
  title = "Something went wrong",
  message = "Failed to load data. Please try again later.",
  className,
}: ErrorCardProps) {
  return (
    <div
      className={cn(
        "bg-destructive/5 border border-destructive/20 rounded-md p-8 text-center flex flex-col items-center gap-3",
        className
      )}
    >
      <AlertTriangle className="w-10 h-10 text-destructive opacity-80" />
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">{message}</p>
    </div>
  )
}
