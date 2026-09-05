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
 * 获取当前会话用户；未登录返回 null（调用方返回 401）。
 * 数据操作统一走 admin 客户端 + 显式 user_id 过滤（RLS 为第二道防线）。
 */
export async function requireUser() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
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
  if (error) return map
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
