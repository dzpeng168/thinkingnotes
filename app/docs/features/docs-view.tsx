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
    loading: () => (
      <div className="flex items-center justify-center py-16 text-sm text-warm-400">
        加载中…
      </div>
    ),
  },
)

export function DocsView({ content }: { content: string }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-warm-200/80 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm text-warm-600 hover:text-warm-900 inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
          <h1 className="text-sm font-semibold text-warm-900">功能说明</h1>
        </div>
      </header>

      <main className="flex-1 w-full">
        <article className="max-w-3xl mx-auto px-6 py-10">
          <div className="rounded-2xl bg-white border border-warm-200/70 shadow-sm p-6 sm:p-10">
            <MarkdownView value={content} />
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  )
}
