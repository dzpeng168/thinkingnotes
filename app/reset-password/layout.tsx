import type { Metadata } from 'next'

/**
 * 密码重置流程：私有链接（含一次性 token），不应被搜索引擎索引。
 * middleware 会把未登录用户重定向到 /login，但 meta robots tag 二次加固。
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
