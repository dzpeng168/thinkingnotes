"use client"

import dynamic from "next/dynamic"

// Milkdown 依赖浏览器环境，必须 ssr:false
const MilkdownEditor = dynamic(
  () => import("@/components/editor/milkdown-editor").then((m) => m.MilkdownEditor),
  { ssr: false, loading: () => (
    <div className="flex-1 flex items-center justify-center text-sm text-warm-400">
      加载编辑器...
    </div>
  )},
)

interface Props {
  value: string
  onChange: (v: string) => void
  noteId: string
  /** 初始编辑器模式（新建笔记落地时传 "editor"） */
  initialMode?: "preview" | "editor" | "split" | "source"
  /** 强制只读预览模式 */
  readOnly?: boolean
}

/**
 * 统一 Markdown 模板：顶部 Markdown 工具栏 + 单一编辑器主体。
 *
 * 模板本身的"布局"完全由 .md 文件的内容段落（## 标题）表达：
 *  - 康奈尔：## 主栏 · 笔记正文 / ## 线索栏 / ## 总结栏
 *  - 5W2H：## Who ... / ## What ... / ... / ## How much ...
 *  - 六顶思考帽：## 白帽 · 事实与数据 / ## 红帽 · ... / ... / ## 蓝帽 · ...
 *
 * 用户在同一个 Milkdown 编辑器里编辑整篇 markdown，标题作为段落分隔即"布局"。
 */
export function MarkdownTemplate({ value, onChange, initialMode, readOnly }: Props) {
  return (
    <MilkdownEditor value={value} onChange={onChange} initialMode={initialMode} readOnly={readOnly} />
  )
}
