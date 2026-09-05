"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants: Record<string, string> = {
      default:
        "bg-warm-600 text-warm-50 hover:bg-warm-700 shadow-warm transition-colors",
      secondary:
        "bg-warm-100 text-warm-900 hover:bg-warm-200",
      outline:
        "border border-warm-300 bg-transparent hover:bg-warm-100 text-warm-800",
      ghost:
        "hover:bg-warm-100 text-warm-800",
      destructive:
        "bg-red-500 text-white hover:bg-red-600",
      link: "text-warm-700 underline-offset-4 hover:underline",
    }
    const sizes: Record<string, string> = {
      default: "h-10 px-4 py-2",
      sm: "h-9 px-3 text-sm",
      lg: "h-11 px-8",
      icon: "h-10 w-10",
    }
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
