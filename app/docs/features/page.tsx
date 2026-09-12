import type { Metadata } from 'next'
import { readFile } from 'fs/promises'
import path from 'path'
import { cookies, headers } from 'next/headers'
import { DocsView } from './docs-view'

export const dynamic = 'force-dynamic'

const LOCALE_COOKIE_KEY = 'thinkingnotes:locale'

/** docs/features — 公开营销页，值得被索引，SSR 输出本地化 metadata */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale()
  if (locale === 'zh') {
    return {
      title: '功能介绍 · ThinkingNotes 思维笔记',
      description:
        'ThinkingNotes 的全部功能：15 种思维模型模板、云端多端同步、原生 Markdown 编辑器、自动保存、标签与分类管理。',
      keywords: [
        'ThinkingNotes 功能', '思维笔记功能', '模板笔记本',
        'Markdown 编辑器', '云端笔记同步',
      ],
      alternates: { canonical: '/docs/features' },
    }
  }
  return {
    title: 'Features · ThinkingNotes',
    description:
      'All ThinkingNotes features: 15 thinking-model templates, cloud sync across devices, native Markdown editor, auto-save, tags & categories.',
    keywords: [
      'ThinkingNotes features', 'markdown notes', 'thinking model templates',
      'cloud note sync', 'cornell notes', '5w2h',
    ],
    alternates: { canonical: '/docs/features' },
  }
}

async function readDoc(file: string): Promise<string | null> {
  try {
    return await readFile(path.join(process.cwd(), 'public', 'docs', file), 'utf-8')
  } catch {
    // 文件缺失（例如尚未翻译）时返回 null，由调用方降级，避免整页 500
    return null
  }
}

/**
 * 按语言加载文档：zh → features.zh.md，en → features.en.md。
 * 任一语言文件缺失时降级到另一份，保证链接永远可用（曾因缺少 zh 文件导致中文版 500）。
 */
async function loadDoc(locale: 'zh' | 'en'): Promise<string> {
  const primary = locale === 'zh' ? 'features.zh.md' : 'features.en.md'
  const fallback = locale === 'zh' ? 'features.en.md' : 'features.zh.md'
  const content = (await readDoc(primary)) ?? (await readDoc(fallback))
  if (!content) throw new Error('features doc not found')
  return content
}

async function detectLocale(): Promise<'zh' | 'en'> {
  const cookie = cookies().get(LOCALE_COOKIE_KEY)?.value
  if (cookie === 'zh' || cookie === 'en') return cookie
  // 无 cookie（首访 / cookie 被清）：回退浏览器语言，避免"界面中文但文档英文"
  const accept = headers().get('accept-language') ?? ''
  return /zh(-|_|$)/i.test(accept) ? 'zh' : 'en'
}

export default async function FeaturesPage() {
  const locale = await detectLocale()
  const content = await loadDoc(locale)
  return <DocsView content={content} locale={locale} />
}
