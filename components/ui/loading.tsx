import { cn } from "@/lib/utils"

/**
 * 统一加载动画组件：
 * - Spinner：旋转圆环（按钮内、状态条内的小指示器）
 * - TopProgressBar：页面顶部不确定进度条（耗时操作进行中）
 * - LoadingScreen：整页加载占位（笔记打开等）
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
