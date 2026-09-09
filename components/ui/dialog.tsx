"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

export function Dialog({ open, onOpenChange, children, className }: DialogProps) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  // 打开时锁定背景滚动，避免移动端弹层背后页面跟着滑动
  React.useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // ESC 关闭
  React.useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onOpenChange])

  if (!open || !mounted) return null

  return createPortal(
    // 移动端：底部抽屉式；>=640px：居中弹窗。外层可滚动，内容超高时不会被裁切
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
      <div
        className="fixed inset-0 bg-warm-900/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 flex min-h-full w-full items-end justify-center sm:items-center sm:p-4">
        <div className={cn("w-full max-w-lg", className)}>{children}</div>
      </div>
    </div>,
    document.body,
  )
}

export function DialogContent({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative z-10 w-full rounded-t-2xl sm:rounded-2xl border border-warm-200 bg-warm-50 p-5 sm:p-6 shadow-warm-lg animate-in fade-in zoom-in-95 duration-200",
        // 高度上限 + 内部滚动：小屏/键盘弹起时按钮也不会被顶出可视区
        "max-h-[100dvh] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain",
        "pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-6",
        className
      )}
    >
      {children}
    </div>
  )
}

export function DialogHeader({
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

export function DialogTitle({
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

export function DialogDescription({
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

export function DialogFooter({
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
