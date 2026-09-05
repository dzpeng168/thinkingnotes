"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

export interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

export function AlertDialog({ open, onOpenChange, children, className }: AlertDialogProps) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])
  if (!open || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-warm-900/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className={cn("relative z-10 w-full max-w-md", className)}>{children}</div>
    </div>,
    document.body,
  )
}

export function AlertDialogContent({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mx-4 rounded-2xl border border-warm-200 bg-warm-50 p-6 shadow-warm-lg animate-in fade-in zoom-in-95 duration-200",
        className
      )}
    >
      {children}
    </div>
  )
}

export function AlertDialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 text-left mb-4", className)}
      {...props}
    />
  )
}

export function AlertDialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-semibold leading-none tracking-tight text-warm-900", className)}
      {...props}
    />
  )
}

export function AlertDialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-warm-600", className)}
      {...props}
    />
  )
}

export function AlertDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2", className)}
      {...props}
    />
  )
}

export function AlertDialogAction({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all h-10 px-4 py-2 bg-warm-600 text-warm-50 hover:bg-warm-700 shadow-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-500 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export function AlertDialogCancel({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all h-10 px-4 py-2 border border-warm-300 bg-transparent hover:bg-warm-100 text-warm-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-500 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}
