import { cn } from "@/lib/utils"

/**
 * 统一加载动画组件：
 * - Spinner：旋转圆环（按钮内、状态条内的小指示器）
 * - TopProgressBar：页面顶部不确定进度条（耗时操作进行中）
 * - LoadingScreen：整页加载占位（笔记打开等）
 * - Skeleton / NoteCardSkeleton：骨架屏占位（列表加载时替代闪烁的空状态）
 */

const SPINNER_SIZES = {
  sm: "w-3.5 h-3.5 border-2",
  md: "w-5 h-5 border-2",
  lg: "w-8 h-8 border-[3px]",
} as const

export function Spinner({
  size = "md",
  className,
}: {
  size?: keyof typeof SPINNER_SIZES
  className?: string
}) {
  return (
    <span
      role="status"
      aria-hidden
      className={cn(
        "inline-block shrink-0 rounded-full border-warm-500 border-t-transparent animate-spin",
        SPINNER_SIZES[size],
        className,
      )}
    />
  )
}

/** 顶部不确定进度条：挂在页面根节点，耗时操作期间渲染 */
export function TopProgressBar({ className }: { className?: string }) {
  return (
    <div className={cn("fixed top-0 left-0 right-0 h-[3px] z-[100] overflow-hidden", className)}>
      <div className="absolute h-full rounded-full bg-warm-500 animate-loading-bar" />
    </div>
  )
}

/** 整页加载占位：spinner + 进度条 + 文字 */
export function LoadingScreen({ text }: { text?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-warm-50 gap-5">
      <Spinner size="lg" />
      <div className="w-40 h-1 rounded-full bg-warm-200/80 overflow-hidden">
        <div className="h-full rounded-full bg-warm-500 animate-loading-bar" />
      </div>
      {text && <div className="text-sm text-warm-500">{text}</div>}
    </div>
  )
}

/** 骨架色块：带左右扫过的浅色高光（shimmer） */
export function Skeleton({
  className,
  rounded = "rounded-lg",
}: {
  className?: string
  rounded?: string
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-warm-200/60",
        rounded,
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent"
      />
    </div>
  )
}

/** 笔记卡片骨架屏 —— 尺寸、结构与真实 NoteCard 严格一致，避免布局跳动 */
export function NoteCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-warm-200 bg-white p-6 min-h-[240px]">
      {/* 顶部徽章占位 */}
      <div className="flex items-center justify-between mb-4 pr-20">
        <Skeleton className="h-5 w-20" rounded="rounded-full" />
      </div>
      {/* 标题占位：两行 */}
      <div className="space-y-2 mb-4">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-5 w-3/5" />
      </div>
      {/* 标签占位 */}
      <div className="flex gap-1.5 mb-4 min-h-[22px]">
        <Skeleton className="h-[22px] w-14" rounded="rounded-full" />
        <Skeleton className="h-[22px] w-12" rounded="rounded-full" />
      </div>
      {/* 底部分隔线 + meta */}
      <div className="mt-auto pt-4 border-t border-warm-100">
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}
