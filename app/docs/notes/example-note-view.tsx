import Link from 'next/link'
import { ArrowLeft, PenLine } from 'lucide-react'
import { SiteFooter } from '@/components/site-footer'

interface Props {
  html: string
  locale: 'zh' | 'en'
  name: string
  slug: string
}

/**
 * 示例笔记 SSR 视图：服务端 marked 渲染的 HTML 直接输出（爬虫可抓取全文），
 * 布局沿用 docs/features 的 header + 文章卡片 + footer 结构。
 */
export function ExampleNoteView({ html, locale, name, slug }: Props) {
  const copy =
    locale === 'zh'
      ? {
          back: '返回首页',
          noteLabel: '示例笔记',
          ctaTitle: `用「${name}」模板记录你的思考`,
          ctaDesc: 'ThinkingNotes 内置 16 种思维模型模板，注册即可使用这个模板开始记录。',
          ctaBtn: '免费开始使用',
        }
      : {
          back: 'Back home',
          noteLabel: 'Example Note',
          ctaTitle: `Take notes with the ${name} template`,
          ctaDesc: 'ThinkingNotes ships 16 thinking-model templates. Sign up to start writing with this one.',
          ctaBtn: 'Get started free',
        }

  // 语言切换：zh ↔ en 互链（同时是页面的 hreflang 入口）
  const otherLocale = locale === 'zh' ? 'en' : 'zh'
  const otherHref =
    locale === 'zh' ? `/docs/notes/en/${slug}` : `/docs/notes/${slug}`

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
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-warm-900 truncate">
              {name}
              <span className="ml-2 text-xs font-normal text-warm-400">{copy.noteLabel}</span>
            </span>
            <span className="h-4 w-px bg-warm-200" aria-hidden />
            <Link
              href={otherHref}
              hrefLang={otherLocale}
              className="text-xs text-warm-500 hover:text-warm-900 transition-colors border border-warm-200 rounded-full px-2.5 py-0.5"
            >
              {otherLocale === 'en' ? 'English' : '中文'}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="rounded-2xl bg-white border border-warm-200/70 shadow-sm p-5 sm:p-10">
            {/* 复用编辑器的 markdown 内容样式（服务端渲染版） */}
            <div
              className="thinkingnotes-milkdown text-[15px] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>

          {/* 转化 CTA */}
          <div className="mt-8 rounded-2xl border border-warm-200 bg-gradient-to-r from-warm-50 to-warm-100/60 p-6 sm:p-8 text-center">
            <h2 className="text-lg font-semibold text-warm-900">{copy.ctaTitle}</h2>
            <p className="mt-2 text-sm text-warm-600 max-w-xl mx-auto leading-relaxed">
              {copy.ctaDesc}
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-warm-800 px-5 h-11 text-sm font-medium text-white hover:bg-warm-700 transition-colors"
            >
              <PenLine className="w-4 h-4" />
              {copy.ctaBtn}
            </Link>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  )
}
