import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * service role 客户端：绕过 RLS，仅限服务端使用。
 * 所有查询必须显式过滤 user_id（RLS 之外的第三道防线由调用方保证）。
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}

export type AdminClient = ReturnType<typeof createAdminClient>
