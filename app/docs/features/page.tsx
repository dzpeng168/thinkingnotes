import { readFile } from 'fs/promises'
import path from 'path'
import { cookies } from 'next/headers'
import { DocsView } from './docs-view'

export const dynamic = 'force-dynamic'

const LOCALE_COOKIE_KEY = 'thinkingnotes:locale'

async function loadDoc(locale: string): Promise<string> {
  // en-first fallback: prefer features.zh.md when locale is "zh", else features.en.md
  const file = locale === 'zh' ? 'features.zh.md' : 'features.en.md'
  const filePath = path.join(process.cwd(), 'public', 'docs', file)
  return readFile(filePath, 'utf-8')
}

export default async function FeaturesPage() {
  const cookieStore = cookies()
  const locale = cookieStore.get(LOCALE_COOKIE_KEY)?.value === 'zh' ? 'zh' : 'en'
  const content = await loadDoc(locale)
  return <DocsView content={content} />
}
