import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'

/**
 * 营销 / 登录入口 — 公开可索引页面，提供根 metadata 的本地化覆盖。
 * 根 layout 已输出通用 title/description，这里给登录页追加更有吸引力的文案、OG locale 和 canonical。
 */

const LOCALE_COOKIE_KEY = "thinkingnotes:locale"

function readLocale(): 'zh' | 'en' {
  try {
    const c = cookies().get(LOCALE_COOKIE_KEY)?.value
    if (c === 'zh' || c === 'en') return c
    const accept = headers().get('accept-language') ?? ''
    if (/zh(-|_|$)/i.test(accept)) return 'zh'
  } catch {}
  return 'en'
}

function siteBase(): URL {
  const raw =
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null)
  if (raw) return new URL(raw.startsWith('http') ? raw : `https://${raw}`)
  return new URL('http://localhost:3000')
}

export function generateMetadata(): Metadata {
  const locale = readLocale()
  const base = siteBase()
  const canonical = new URL('/login', base)

  if (locale === 'zh') {
    return {
      title: 'ThinkingNotes — 思维笔记，让思考更有条理',
      description:
        '15 种思维模型模板 · 云端多端同步 · 原生 Markdown 体验。康奈尔笔记、5W2H、六顶思考帽、WOOP，从灵感到行动一步到位。',
      keywords: [
        '思维笔记', '康奈尔笔记', '5W2H', '六顶思考帽',
        '思维模型', 'Markdown 笔记', '云端笔记', 'ThinkingNotes',
      ],
      openGraph: {
        title: 'ThinkingNotes — 思维笔记，让思考更有条理',
        description: '15 种思维模型模板 · 云端多端同步 · 原生 Markdown 体验',
        type: 'website',
        siteName: 'ThinkingNotes',
        url: canonical,
        locale: 'zh_CN',
      },
      twitter: {
        card: 'summary',
        title: 'ThinkingNotes',
        description: '思维笔记 · 15 种模板 · 云端多端同步',
      },
      alternates: { canonical },
    }
  }

  return {
    title: 'ThinkingNotes — Make thinking organized',
    description:
      '15 thinking-model templates · Cloud sync · Native Markdown editor. Cornell, 5W2H, Six Thinking Hats, WOOP — from inspiration to action.',
    keywords: [
      'thinking notes', 'cornell notes', '5w2h', 'six thinking hats',
      'thinking model', 'markdown notes', 'cloud notes', 'ThinkingNotes',
    ],
    openGraph: {
      title: 'ThinkingNotes — Make thinking organized',
      description: '15 thinking-model templates · Cloud sync · Native Markdown editor',
      type: 'website',
      siteName: 'ThinkingNotes',
      url: canonical,
      locale: 'en_US',
    },
    twitter: {
      card: 'summary',
      title: 'ThinkingNotes',
      description: 'Thinking notes · 15 templates · Cloud sync',
    },
    alternates: { canonical },
  }
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
