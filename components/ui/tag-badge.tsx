"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TagBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: string
  closable?: boolean
  onClose?: () => void
}

export function TagBadge({
  color = "#e67e48",
  closable,
  onClose,
  className,
  children,
  ...props
}: TagBadgeProps) {
  return (
    <span
      style={{ backgroundColor: `${color}22`, borderColor: color, color }}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        className
      )}
      {...props}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {children}
      {closable && (
        <button
          type="button"
          className="ml-0.5 rounded-full hover:bg-warm-900/10 p-0.5 transition-colors"
          onClick={onClose}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}
