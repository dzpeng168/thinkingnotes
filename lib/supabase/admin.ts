import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * service role 客户端：绕过 RLS，仅限服务端使用。
 * 所有查询必须显式过滤 user_id（RLS 之外的第三道防线由调用方保证）。
 *
 * 模块级单例：同一个 Node 进程内复用 client 实例和 HTTP 连接池，
 * 避免每次 route handler 都新建 client 带来的冷启动开销。
 */
let _cachedClient: SupabaseClient | null = null

export function createAdminClient() {
  if (_cachedClient) return _cachedClient

  _cachedClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      // 关闭 fetch 重试：路由 handler 自行处理错误，避免超时叠加
      global: {
        headers: {
          'x-client-info': 'thinkingnotes-web',
        },
      },
    },
  )
  return _cachedClient
}

export type AdminClient = ReturnType<typeof createAdminClient>
