import type { MetadataRoute } from 'next'

/**
 * robots.txt：
 * - 允许爬虫索引公开页面（登录/重置密码/features 文档）
 * - 禁止爬取用户私有笔记页 /note/* 和 API 路由，避免把空壳或登录后的用户数据暴露到搜索结果
 */
export default function robots(): MetadataRoute.Robots {
  const base =
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000')

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/reset-password', '/docs/features'],
        disallow: ['/note/*', '/api/*'],
      },
    ],
    sitemap: `${base.replace(/\/$/, '')}/sitemap.xml`,
    host: base.replace(/\/$/, ''),
  }
}
