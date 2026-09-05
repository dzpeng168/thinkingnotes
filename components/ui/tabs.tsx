"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export function Tabs({
  value,
  onValueChange,
  className,
  children,
}: {
  value: string
  onValueChange: (v: string) => void
  className?: string
  children: React.ReactNode
}) {
  const ctx = { value, onValueChange }
  return (
    <TabsContext.Provider value={ctx}>
      <div className={cn(className)}>{children}</div>
    </TabsContext.Provider>
  )
}

const TabsContext = React.createContext<{
  value: string
  onValueChange: (v: string) => void
}>({ value: "", onValueChange: () => {} })

export function TabsList({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg bg-warm-100 p-1 text-warm-700",
        className
      )}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({
  value,
  className,
  children,
  ...props
}: { value: string; className?: string; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(TabsContext)
  const active = ctx.value === value
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all",
        active ? "bg-warm-50 text-warm-800 shadow-sm" : "hover:text-warm-900",
        className
      )}
      onClick={() => ctx.onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  )
}

export function TabsContent({
  value,
  className,
  children,
}: { value: string; className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(TabsContext)
  if (ctx.value !== value) return null
  return <div className={cn("mt-4", className)}>{children}</div>
}
