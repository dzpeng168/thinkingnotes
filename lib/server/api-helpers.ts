import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, type AdminClient } from '@/lib/supabase/admin'
import type { Tag } from '@/lib/types'

/** 列表查询字段（不含 content，与桌面版 get_notes 一致） */
export const NOTE_LIST_COLUMNS = 'id,title,template_type,file_path,category_id,updated_at,deleted_at'

/** 统一错误响应：{ error: string } */
export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

/**
 * 获取当前会话用户 —— **零 RPC 版本**。
 * 使用 supabase-js 的 getSession()：自动从 cookie 读 access token，本地 JWT decode，
 * 不调 Auth server（不像 getUser() 每次要 RPC 验签，那通常要 300ms+）。
 *
 * 安全性：
 *   1. Cookie 由 Next server 自己读（客户端无法伪造服务端 cookie）
 *   2. 所有数据操作统一走 admin client + 显式 user_id 过滤
 *
 * 注意：如果 access token 过期但 refresh token 还有效，middleware（对页面路由）会自动刷新，
 *       但 API 路由不经过 middleware —— 这种场景极少（token 1 小时过期）。
 */
export async function requireUser() {
  const supabase = createClient()

  // 1) 快路径：本地 decode cookie 里的 access token（零 RPC）
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session?.user) return session.user

  // 2) 兜底：cookie 里的 token 过期/损坏时，走 Auth server 验签并自动刷新。
  //    getUser() 内部会用 refresh_token 换新 session，并通过 setAll 把新 cookie 写回响应，
  //    避免"token 刚好过期 + API 路由不过 middleware"导致整个列表 401 查不到数据。
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ?? null
}

/** 未登录的统一 401 响应 */
export const unauthorized = () => jsonError('未登录或会话已过期', 401)

/** 批量取笔记的标签列表（note_tags join tags，按 note_id 分组） */
export async function getNoteTagsMap(
  admin: AdminClient,
  userId: string,
  noteIds: string[],
): Promise<Map<string, Tag[]>> {
  const map = new Map<string, Tag[]>()
  if (noteIds.length === 0) return map
  const { data, error } = await admin
    .from('note_tags')
    .select('note_id, tags(id, name, color, created_at, user_id)')
    .in('note_id', noteIds)
  // 标签关联拉取失败只影响标签展示，不影响笔记本身，降级为空
  if (error) {
    console.warn('[getNoteTagsMap] failed, degrade to empty:', error.message)
    return map
  }
  for (const row of data ?? []) {
    const joined = row.tags as unknown
    const tag = (Array.isArray(joined) ? joined[0] : joined) as
      | (Tag & { user_id: string })
      | null
      | undefined
    // 防御：仅归属当前用户的标签（正常数据必然如此）
    if (!tag || tag.user_id !== userId) continue
    const list = map.get(row.note_id) ?? []
    const { user_id: _uid, ...rest } = tag
    list.push(rest)
    map.set(row.note_id, list)
  }
  return map
}

/** JS 递归收集某分类下所有后代分类 id（分类量级小，无需 WITH RECURSIVE） */
export function collectSubCategoryIds(
  categories: { id: string; parent_id: string | null }[],
  rootId: string,
): string[] {
  const ids = [rootId]
  const queue = [rootId]
  while (queue.length > 0) {
    const cur = queue.shift()!
    for (const c of categories) {
      if (c.parent_id === cur) {
        ids.push(c.id)
        queue.push(c.id)
      }
    }
  }
  return ids
}
