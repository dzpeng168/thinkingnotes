import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Route Handler 用服务端客户端（绑定请求 cookie，可写回会话刷新）。
 * 数据操作请使用 admin 客户端 + 显式 user_id 过滤。
 */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Server Component 中调用时无法写 cookie，由 middleware 刷新
          }
        },
      },
    },
  )
}
