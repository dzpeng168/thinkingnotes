"use client"

import dynamic from "next/dynamic"
import { useRef, useState, type ComponentType } from "react"
import {
  Bold, Italic, Heading2, Quote, List, ListOrdered, CheckSquare,
  Code2, Link2, Minus, Eye, PencilLine,
} from "lucide-react"
import { useT } from "@/lib/i18n"

// 预览仍复用 Milkdown 只读渲染，保证与桌面端渲染效果一致；浏览器环境必须 ssr:false
const MarkdownView = dynamic(
  () => import("@/components/editor/markdown-view").then((m) => m.MarkdownView),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center text-sm text-warm-400">…</div>
    ),
  },
)

interface Props {
  value: string
  onChange: (v: string) => void
  /** 初始模式：新建笔记落地（edit=1）时直接进编辑 */
  initialMode?: "edit" | "preview"
}

type Mode = "edit" | "preview"

/**
 * 简化编辑模式（移动端专用）。
 *
 * 桌面端的 Milkdown（ProseMirror）在手机上体验很差：工具栏密集、中文输入法与
 * 富文本选区冲突、键盘弹起后光标不可见。这里改成最朴素也最可靠的方案：
 *  - 编辑态：原生 textarea 直写 Markdown（16px 字号，避免 iOS 聚焦自动缩放）
 *  - 预览态：复用 Milkdown 只读渲染
 *  - 一条精简工具栏：加粗 / 斜体 / 标题 / 引用 / 列表 / 待办 / 代码 / 链接 / 分隔线
 * 不做图片上传、表格、分栏等重操作，保持"够用即可"。
 */
export function SimpleMarkdownEditor({ value, onChange, initialMode = "preview" }: Props) {
  const { t } = useT()
  const [mode, setMode] = useState<Mode>(initialMode)
  const taRef = useRef<HTMLTextAreaElement>(null)

  /** 包裹选区：**粗体** / *斜体* / `代码` */
  const wrapSelection = (before: string, after = before, placeholder = "") => {
    const ta = taRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = value.slice(start, end) || placeholder
    const next = value.slice(0, start) + before + selected + after + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, start + before.length + selected.length)
    })
  }

  /** 行前缀开关：# 标题 / > 引用 / - 列表 / 1. 有序 / - [ ] 待办（再点一次取消） */
  const toggleLinePrefix = (prefix: string) => {
    const ta = taRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const lineStart = value.lastIndexOf("\n", start - 1) + 1
    const nl = value.indexOf("\n", end)
    const lineEnd = nl === -1 ? value.length : nl
    const block = value.slice(lineStart, lineEnd)
    const lines = block.length ? block.split("\n") : [""]
    const already = lines.every((l) => l.startsWith(prefix))
    const nextBlock = lines
      .map((l) => (already ? l.slice(prefix.length) : prefix + l))
      .join("\n")
    const next = value.slice(0, lineStart) + nextBlock + value.slice(lineEnd)
    onChange(next)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(lineStart, lineStart + nextBlock.length)
    })
  }

  /** 整块插入：分隔线 / 代码块 */
  const insertBlock = (text: string) => {
    const ta = taRef.current
    if (!ta) return
    const start = ta.selectionStart
    const before = value.slice(0, start)
    const after = value.slice(start)
    const lead = before && !before.endsWith("\n") ? "\n" : ""
    const next = before + lead + text + after
    onChange(next)
    requestAnimationFrame(() => {
      ta.focus()
      const pos = before.length + lead.length + text.length
      ta.setSelectionRange(pos, pos)
    })
  }

  const insertLink = () => {
    const url = window.prompt(t("editor.linkPrompt"), "https://")
    if (url === null) return
    wrapSelection("[", `](${url})`, t("editor.linkText"))
  }

  const TOOLS: { icon: ComponentType<{ className?: string }>; title: string; run: () => void }[] = [
    { icon: Bold, title: t("editor.bold"), run: () => wrapSelection("**", "**", t("editor.boldText")) },
    { icon: Italic, title: t("editor.italic"), run: () => wrapSelection("*", "*", t("editor.italicText")) },
    { icon: Heading2, title: t("editor.h2"), run: () => toggleLinePrefix("## ") },
    { icon: Quote, title: t("editor.quote"), run: () => toggleLinePrefix("> ") },
    { icon: List, title: t("editor.bulletList"), run: () => toggleLinePrefix("- ") },
    { icon: ListOrdered, title: t("editor.orderedList"), run: () => toggleLinePrefix("1. ") },
    { icon: CheckSquare, title: t("editor.taskList"), run: () => toggleLinePrefix("- [ ] ") },
    { icon: Code2, title: t("editor.inlineCode"), run: () => wrapSelection("`", "`", "code") },
    { icon: Link2, title: t("editor.link"), run: insertLink },
    { icon: Minus, title: t("editor.hr"), run: () => insertBlock("\n---\n") },
  ]

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* 顶部：模式切换 + 精简工具栏（可横向滚动，适配窄屏） */}
      <div className="shrink-0 flex items-center gap-1.5 px-2 py-1.5 border-b border-warm-200 bg-warm-50 rounded-t-xl">
        <div className="flex items-center rounded-md border border-warm-200 bg-white p-0.5 shrink-0">
          <button
            onClick={() => setMode("edit")}
            className={`h-7 px-2.5 rounded flex items-center gap-1 text-xs transition-colors ${
              mode === "edit" ? "bg-warm-100 text-warm-800 font-medium" : "text-warm-500"
            }`}
          >
            <PencilLine className="w-3.5 h-3.5" /> {t("editor.simpleEdit")}
          </button>
          <button
            onClick={() => setMode("preview")}
            className={`h-7 px-2.5 rounded flex items-center gap-1 text-xs transition-colors ${
              mode === "preview" ? "bg-warm-100 text-warm-800 font-medium" : "text-warm-500"
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> {t("editor.simplePreview")}
          </button>
        </div>

        {mode === "edit" && (
          <div className="flex items-center gap-0.5 overflow-x-auto flex-1 min-w-0">
            {TOOLS.map(({ icon: Icon, title, run }, i) => (
              <button
                key={i}
                type="button"
                title={title}
                aria-label={title}
                // 用 onMouseDown 阻止默认行为，避免点击工具栏时 textarea 失焦丢失选区
                onMouseDown={(e) => e.preventDefault()}
                onClick={run}
                className="w-8 h-8 shrink-0 rounded-md flex items-center justify-center text-warm-600 hover:bg-warm-100 active:bg-warm-200 transition-colors"
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        )}
      </div>

      {mode === "edit" ? (
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          placeholder={t("editor.simplePlaceholder")}
          // text-base = 16px，防止 iOS Safari 聚焦时自动放大页面
          className="flex-1 min-h-0 w-full p-4 text-base leading-relaxed bg-white text-warm-900 resize-none outline-none border-0 rounded-b-xl"
        />
      ) : (
        <div className="flex-1 min-h-0 overflow-auto p-4">
          {value.trim() ? (
            <MarkdownView value={value} />
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-warm-400">
              {t("editor.simpleEmpty")}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
