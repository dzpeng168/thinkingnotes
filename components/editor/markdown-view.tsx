"use client"

import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react"
import { Editor, rootCtx, defaultValueCtx, editorViewOptionsCtx } from "@milkdown/kit/core"
import { commonmark } from "@milkdown/kit/preset/commonmark"
import { gfm } from "@milkdown/kit/preset/gfm"
import { nord } from "@milkdown/theme-nord"

interface Props {
  value: string
}

function MarkdownViewCore({ value }: Props) {
  // value 变化时整体重建（预览场景每次打开内容不同）
  useEditor((root) => {
    return Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root)
        ctx.set(defaultValueCtx, value)
        ctx.set(editorViewOptionsCtx, {
          editable: () => false,
          attributes: {
            class: "thinkingnotes-milkdown",
            spellcheck: "false",
          },
        })
      })
      .config(nord)
      .use(commonmark)
      .use(gfm)
  }, [value])

  return <Milkdown />
}

/**
 * 只读 Markdown 渲染器（示例预览等场景）。
 * Milkdown 依赖浏览器环境，调用方需 dynamic import 并 ssr:false。
 */
export function MarkdownView({ value }: Props) {
  return (
    <MilkdownProvider>
      <MarkdownViewCore value={value} />
    </MilkdownProvider>
  )
}
