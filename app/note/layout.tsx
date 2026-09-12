import type { Metadata } from 'next'

/**
 * 笔记详情 /note/:id — 用户私有数据，不应被搜索引擎索引。
 * - robots.ts 已 disallow /note/*，这里再用 meta robots tag 二次加固（爬虫/UA 可能绕过 robots.txt）
 * - middleware 会把未登录访问 302 到 /login，所以搜索引擎爬虫看不到正文内容；
 *   但加上 noindex 确保任何能以某种方式进入该页的 UA 都不收录、不跟踪外链
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function NoteLayout({ children }: { children: React.ReactNode }) {
  return children
}

