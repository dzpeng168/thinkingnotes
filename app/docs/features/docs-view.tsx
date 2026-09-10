"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SiteFooter } from "@/components/site-footer"

// Milkdown 依赖浏览器环境，必须 ssr:false
const MarkdownView = dynamic(
  () => import("@/components/editor/markdown-view").then((m) => m.MarkdownView),
  {
    ssr: false,
    // 语言无关的中性占位（此处拿不到 locale）
    loading: () => (
      <div className="flex items-center justify-center py-16 text-sm text-warm-400">…</div>
    ),
  },
)

export function DocsView({ content, locale }: { content: string; locale: "zh" | "en" }) {
  const copy = locale === "zh"
    ? { back: "返回首页", title: "功能说明", loading: "加载中…" }
    : { back: "Back home", title: "Features", loading: "Loading…" }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-warm-200/80 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm text-warm-600 hover:text-warm-900 inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {copy.back}
          </Link>
          <h1 className="text-sm font-semibold text-warm-900">{copy.title}</h1>
        </div>
      </header>

      <main className="flex-1 w-full">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="rounded-2xl bg-white border border-warm-200/70 shadow-sm p-5 sm:p-10">
            <MarkdownView value={content} />
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  )
}
