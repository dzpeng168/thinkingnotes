import type { MetadataRoute } from 'next'
import { EXAMPLE_NOTES } from '@/lib/server/example-notes'

/**
 * sitemap.xml：只列公开可爬的页面。
 * 登录后受保护的笔记列表 / 详情页（/, /note/*）不应出现在 sitemap，
 * 它们会被 robots 中的 disallow 屏蔽，避免爬虫索引空壳或用户私有数据。
 * 示例笔记页（/docs/notes/*）为 SSR 静态内容，全部收录（zh + en）。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000')

  const u = (p: string): string => `${base.replace(/\/$/, '')}${p}`
  const now = new Date()

  const entries: MetadataRoute.Sitemap = [
    { url: u('/login'), lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: u('/docs/features'), lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ]

  for (const note of EXAMPLE_NOTES) {
    entries.push({
      url: u(`/docs/notes/${note.slug}`),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    })
    entries.push({
      url: u(`/docs/notes/en/${note.slug}`),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    })
  }

  return entries
}
