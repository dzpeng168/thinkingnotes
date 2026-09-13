import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { marked } from 'marked'
import { ExampleNoteView } from '../../example-note-view'
import {
  EXAMPLE_NOTES,
  findExampleNote,
  exampleNoteMeta,
  exampleNotePath,
  readExampleMd,
} from '@/lib/server/example-notes'

// build 时预渲染全部英文示例页
export function generateStaticParams() {
  return EXAMPLE_NOTES.map((n) => ({ slug: n.slug }))
}

type Params = { params: { slug: string } }

/** SEO metadata：title/description/canonical + zh↔en hreflang */
export function generateMetadata({ params }: Params): Metadata {
  const note = findExampleNote(params.slug)
  if (!note) return {}
  const meta = exampleNoteMeta(note, 'en')
  const zh = exampleNotePath(note.slug, 'zh')
  const en = exampleNotePath(note.slug, 'en')
  const title = `${meta.name} Example · ThinkingNotes`
  const description = `${meta.desc} — see a full example note written with the ${meta.name} template on ThinkingNotes.`
  return {
    title,
    description,
    keywords: [meta.name, `${meta.name} example`, 'thinking model', 'note template', 'ThinkingNotes'],
    alternates: {
      canonical: en,
      languages: { 'zh-CN': zh, en, 'x-default': zh },
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: en,
      siteName: 'ThinkingNotes',
      locale: 'en_US',
    },
  }
}

export default async function ExampleNoteEnPage({ params }: Params) {
  const note = findExampleNote(params.slug)
  if (!note) notFound()
  const md = await readExampleMd(params.slug, 'en')
  if (!md) notFound()

  const html = marked.parse(md, { async: false }) as string
  const meta = exampleNoteMeta(note, 'en')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${meta.name} Example · ThinkingNotes`,
    description: meta.desc,
    inLanguage: 'en',
    about: meta.name,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ExampleNoteView html={html} locale="en" name={meta.name} slug={note.slug} />
    </>
  )
}
