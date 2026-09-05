import type { Metadata } from 'next'
import './globals.css'
import { AppProviders } from '@/components/app-providers'

const LOCALE_COOKIE_KEY = "thinkingnotes:locale"

// 静态版本的 messages（仅用于 SSR metadata，不引入 bundle）
const META_MESSAGES: Record<"zh" | "en", { title: string; description: string }> = {
  zh: {
    title: 'ThinkingNotes - 思维笔记',
    description: '帮你把想问题变得更有条理',
  },
  en: {
    title: 'ThinkingNotes',
    description: 'Make thinking more efficient and organized',
  },
}

function readLocaleFromHeadersCookie(): "zh" | "en" {
  // App Router 中无法稳定同步读取 cookie 到 metadata（需 use server + cookie()），
  // 这里按默认语言返回（Web 版默认英文），真实语言由客户端脚本 + Provider 同步改写 <title>。
  return "en"
}

const metaInitial = META_MESSAGES[readLocaleFromHeadersCookie()]

export const metadata: Metadata = {
  title: metaInitial.title,
  description: metaInitial.description,
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
  return (
    <html lang="en-US" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-warm-50 antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
