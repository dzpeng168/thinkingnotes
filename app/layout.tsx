import type { Metadata } from 'next'
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

export const metadata: Metadata = {
  title: 'ThinkingNotes',
  description: 'Make thinking more efficient and organized',
}

// 防止 FOUC：在 React 水合前同步设置 data-theme + <html lang>
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
    var langAttr = l === 'en' ? 'en-US' : 'zh-CN';
    document.documentElement.setAttribute('lang', langAttr);
    var metaMap = l === 'en'
      ? { title: 'ThinkingNotes', desc: 'Make thinking more efficient and organized' }
      : { title: 'ThinkingNotes - 思维笔记', desc: '帮你把想问题变得更有条理' };
    document.title = metaMap.title;
    var existing = document.querySelector('meta[name="description"]');
    if (!existing) {
      existing = document.createElement('meta');
      existing.setAttribute('name', 'description');
      document.head.appendChild(existing);
    }
    existing.setAttribute('content', metaMap.desc);
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
