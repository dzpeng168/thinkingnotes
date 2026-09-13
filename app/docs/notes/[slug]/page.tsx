import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { marked } from 'marked'
import { ExampleNoteView } from '../example-note-view'
import {
  EXAMPLE_NOTES,
  findExampleNote,
  exampleNoteMeta,
  exampleNotePath,
  readExampleMd,
} from '@/lib/server/example-notes'

// build 时预渲染全部示例页（静态 HTML，爬虫抓取与 SSR 等效）
export function generateStaticParams() {
  return EXAMPLE_NOTES.map((n) => ({ slug: n.slug }))
}

type Params = { params: { slug: string } }

/** SEO metadata：title/description/canonical + zh↔en hreflang */
export function generateMetadata({ params }: Params): Metadata {
  const note = findExampleNote(params.slug)
  if (!note) return {}
  const meta = exampleNoteMeta(note, 'zh')
  const zh = exampleNotePath(note.slug, 'zh')
  const en = exampleNotePath(note.slug, 'en')
  const title = `${meta.name}示例笔记 · ThinkingNotes`
  const description = `${meta.desc}。在线查看完整的${meta.name}示例，了解如何在 ThinkingNotes 中使用这一思维模型记录思考。`
  return {
    title,
    description,
    keywords: [meta.name, `${meta.name}示例`, '思维模型', '笔记模板', 'ThinkingNotes'],
    alternates: {
      canonical: zh,
      languages: { 'zh-CN': zh, en, 'x-default': zh },
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: zh,
      siteName: 'ThinkingNotes',
      locale: 'zh_CN',
    },
  }
}

export default async function ExampleNotePage({ params }: Params) {
  const note = findExampleNote(params.slug)
  if (!note) notFound()
  const md = await readExampleMd(params.slug, 'zh')
  if (!md) notFound()

  const html = marked.parse(md, { async: false }) as string
  const meta = exampleNoteMeta(note, 'zh')

  // JSON-LD 结构化数据（Article）
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${meta.name}示例笔记 · ThinkingNotes`,
    description: meta.desc,
    inLanguage: 'zh-CN',
    about: meta.name,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ExampleNoteView html={html} locale="zh" name={meta.name} slug={note.slug} />
    </>
  )
}
