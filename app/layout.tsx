import type { Metadata, Viewport } from 'next'
import { cookies, headers } from 'next/headers'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { AppProviders } from '@/components/app-providers'

const LOCALE_COOKIE_KEY = "thinkingnotes:locale"
const LANG_ATTR: Record<"zh" | "en", string> = { zh: "zh-CN", en: "en-US" }

/**
 * 服务端语言判定：cookie > 浏览器 Accept-Language > 默认英文。
 * 加上 Accept-Language 回退，避免首访的中文用户先闪一帧英文界面
 * （客户端 detectInitialLocale 也用同一套优先级）。
 */
function readLocale(): "zh" | "en" {
  try {
    const c = cookies().get(LOCALE_COOKIE_KEY)?.value
    if (c === 'zh' || c === 'en') return c
    const accept = headers().get('accept-language') ?? ''
    if (/zh(-|_|$)/i.test(accept)) return 'zh'
  } catch {}
  return 'en'
}

/** 站点根域名，从环境变量读取，dev 回退 localhost */
function siteBase(): URL {
  const raw = process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (raw) {
    try { return new URL(raw.startsWith('http') ? raw : `https://${raw}`) } catch {}
  }
  return new URL('http://localhost:3000')
}

const SITE_NAME = 'ThinkingNotes'

const META_BY_LOCALE: Record<"zh" | "en", {
  title: string
  description: string
  keywords: string[]
  ogTitle: string
  ogDesc: string
}> = {
  zh: {
    title: 'ThinkingNotes — 思维笔记',
    description: '帮你把想问题变得更有条理。康奈尔笔记、5W2H、六顶思考帽、WOOP 等 15 种思维模型模板，云端多端同步，原生 Markdown 体验。',
    keywords: ['思维笔记', '模板笔记', '康奈尔笔记', '5W2H', '六顶思考帽', '思维模型', 'Markdown 笔记', 'Note-taking', 'ThinkingNotes'],
    ogTitle: 'ThinkingNotes — 帮你把想问题变得更有条理',
    ogDesc: '15 种思维模型模板 · 云端多端同步 · 原生 Markdown 体验',
  },
  en: {
    title: 'ThinkingNotes',
    description: 'Make thinking more efficient and organized. 15 thinking-model templates including Cornell, 5W2H, Six Thinking Hats, WOOP — cloud-synced, native Markdown.',
    keywords: ['thinking notes', 'note templates', 'cornell notes', '5w2h', 'six thinking hats', 'thinking model', 'markdown notes', 'cloud notes', 'ThinkingNotes'],
    ogTitle: 'ThinkingNotes — Make thinking organized',
    ogDesc: '15 thinking-model templates · Cloud sync · Native Markdown editor',
  },
}

/** 根 metadata：SSR 按 cookie locale 输出对应语言的 title/description/keywords，
 *  themeScript 不再覆盖 title/meta description（避免与 Metadata API 冲突）。 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = readLocale()
  const meta = META_BY_LOCALE[locale]
  const base = siteBase()

  return {
    metadataBase: base,
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    applicationName: SITE_NAME,
    generator: 'Next.js',
    authors: [{ name: 'ThinkingNotes Team' }],
    creator: 'ThinkingNotes',
    publisher: 'ThinkingNotes',
    formatDetection: { email: false, address: false, telephone: false },
    robots: { index: true, follow: true },
    icons: {
      icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
      apple: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: meta.ogTitle,
      description: meta.ogDesc,
      url: base,
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
    },
    alternates: {
      canonical: base,
    },
    twitter: {
      card: 'summary',
      title: meta.ogTitle,
      description: meta.ogDesc,
    },
    // canonical / alternates 由 Next 按 metadataBase + 当前路由自动生成
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fef7f0' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1005' },
  ],
  width: 'device-width',
  initialScale: 1,
}

// 防止 FOUC：在 React 水合前同步设置 data-theme + <html lang>
// title/description 由 generateMetadata SSR 输出，这里不再覆盖以免与 Metadata API 冲突
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('thinkingnotes-theme');
    if (t !== 'minimal' && t !== 'business') t = 'minimal';
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'minimal');
  }
  try {
    var l = localStorage.getItem('thinkingnotes:locale');
    if (l !== 'zh' && l !== 'en') {
      try {
        var nav = (navigator.language || '').toLowerCase();
        l = nav.indexOf('zh') === 0 ? 'zh' : (nav.indexOf('en') === 0 ? 'en' : 'en');
      } catch (_) { l = 'en'; }
    }
    document.documentElement.setAttribute('lang', l === 'en' ? 'en-US' : 'zh-CN');
  } catch (e) {}
})();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = readLocale()
  return (
    <html lang={LANG_ATTR[locale]} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-warm-50 antialiased">
        <AppProviders initialLocale={locale}>{children}</AppProviders>
        {/* Vercel Analytics：生产环境自动上报，本地 dev 为空操作 */}
        <Analytics />
      </body>
    </html>
  )
}
