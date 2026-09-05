"use client"

import type { TemplateType } from "@/lib/types"
import { MarkdownTemplate } from "./markdown-template"

interface Props {
  template: TemplateType
  value: string
  onChange: (v: string) => void
  noteId: string
  /** 初始编辑器模式（新建笔记落地时传 "editor"） */
  initialMode?: "preview" | "editor" | "split" | "source"
}

/**
 * 统一渲染入口：所有模板都使用同一个 Markdown 模板。
 * 不同模板的区别仅在于初始 .md 内容（见 lib/markdown.ts 中的 defaultMarkdownFor），
 * 顶部工具栏与编辑器主体完全一致——模板"布局"由 markdown 内容本身的标题段落表达。
 */
export function TemplateRenderer({ value, onChange, noteId, initialMode }: Props) {
  return <MarkdownTemplate value={value} onChange={onChange} noteId={noteId} initialMode={initialMode} />
}
