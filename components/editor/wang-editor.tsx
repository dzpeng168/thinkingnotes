"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import type { IDomEditor, IEditorConfig, IToolbarConfig } from "@wangeditor/editor"

// 动态导入，避免 SSR（wangEditor 依赖浏览器环境）
const EditorComponent = dynamic(
  () => import("@wangeditor/editor-for-react").then((m) => m.Editor),
  { ssr: false },
)
const ToolbarComponent = dynamic(
  () => import("@wangeditor/editor-for-react").then((m) => m.Toolbar),
  { ssr: false },
)

interface Props {
  /** 初始 HTML 值 */
  value: string
  /** HTML 变化回调（节流/防抖已内部处理） */
  onChange: (html: string) => void
  /** 唯一 key，用于切换笔记/字段时重建编辑器 */
  instanceKey: string
  placeholder?: string
}

// wangEditor 样式在导入时注入；同时给我们自己的包裹层做高度约束
function SimpleWangEditor({ value, onChange, instanceKey, placeholder }: Props) {
  const [editor, setEditor] = useState<IDomEditor | null>(null)

  const toolbarConfig: Partial<IToolbarConfig> = {
    toolbarKeys: [
      "headerSelect",
      "bold",
      "italic",
      "underline",
      "through",
      "|",
      "bulletedList",
      "numberedList",
      "|",
      "color",
      "bgColor",
      "|",
      "blockquote",
      "codeBlock",
      "divider",
      "|",
      "undo",
      "redo",
    ],
  }

  const editorConfig: Partial<IEditorConfig> = {
    placeholder: placeholder ?? "",
    readOnly: false,
    autoFocus: false,
    scroll: true,
    onChange: (editor) => {
      onChange(editor.getHtml())
    },
  }

  // 用 ref 持有最新 editor，避免 effect 依赖数组变动
  const editorRef = { current: editor as IDomEditor | null }

  // 将 markdown 风格纯文本转换为简单 HTML（如果传入的不是 HTML）
  const toHtml = (val: string): string => {
    if (!val) return "<p><br></p>"
    // 粗略判断：包含 <p> 就认为是 HTML
    if (/<\s*(?:p|div|h[1-6]|ul|ol|blockquote|pre)\b/i.test(val)) return val
    // 普通文本按行拆成 <p>
    return val
      .split(/\r?\n/)
      .map((line) => (line.trim() ? `<p>${escapeHtml(line)}</p>` : "<p><br></p>"))
      .join("")
  }

  // 组件销毁 + 实例切换：释放旧编辑器
  useEffect(() => {
    const ed = editor as any
    if (!ed) return
    const current = editorRef.current as any
    // 刚创建好，灌入初始值（仅一次）
    ed.setHtml(toHtml(value))
    return () => {
      // 用 effect 作用域内捕获的局部变量避免 eslint ref.current 警告
      if (current && typeof current.isDestroyed === "function" && !current.isDestroyed()) {
        current.destroy()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  return (
    <div className="w-full h-full flex flex-col bg-white border border-warm-200 rounded-md overflow-hidden">
      <div className="border-b border-warm-200 bg-warm-50 px-1 py-0.5">
        <ToolbarComponent
          mode="default"
          editor={editor}
          defaultConfig={toolbarConfig}
          style={{ borderBottom: "none" }}
        />
      </div>
      <div className="flex-1 min-h-0 overflow-hidden" key={`editor-wrap-${instanceKey}`}>
        <EditorComponent
          key={`editor-${instanceKey}`}
          defaultConfig={editorConfig}
          value={toHtml(value)}
          onCreated={setEditor}
          mode="default"
          style={{ height: "100%", overflowY: "auto" }}
        />
      </div>
    </div>
  )
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function WangEditor(props: Props) {
  // wangEditor 在 SSR 下不可用（依赖 document/window），使用 dynamic + 挂载守卫
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-warm-50 border border-warm-200 rounded-md text-xs text-warm-400">
        加载中...
      </div>
    )
  }
  return <SimpleWangEditor {...props} />
}

// 导入 wangEditor 样式（必须放在使用它的文件里，否则 SSR 时样式不生效）
import "@wangeditor/editor/dist/css/style.css"
