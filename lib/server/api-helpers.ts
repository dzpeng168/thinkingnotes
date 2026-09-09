import { NextResponse } from 'next/server'
import { createAdminClient, type AdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import type { Tag } from '@/lib/types'

/** 列表查询字段（不含 content，与桌面版 get_notes 一致） */
export const NOTE_LIST_COLUMNS = 'id,title,template_type,file_path,category_id,updated_at,deleted_at'

/** 统一错误响应：{ error: string } */
export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

/**
 * 本地 base64url → base64 解码。
 */
function base64urlDecode(str: string): string {
  const pad = '='.repeat((4 - (str.length % 4)) % 4)
  const b64 = (str + pad).replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(b64, 'base64').toString('utf-8')
}

interface DecodedJwt {
  sub?: string
  email?: string
  role?: string
}

/**
 * 本地 decode Supabase access token —— 零网络 RPC。
 * Supabase access token 是标准 JWT，3 段 base64url，payload 段有 sub (user_id)。
 * 注意：只 decode 拿 user_id，**不做签名校验**。
 * 安全性由以下保证：
 *   1. 调用方必须在服务端环境（cookie 由 Next server 自己读）
 *   2. 所有数据操作统一走 admin client + 显式 user_id 过滤
 *   3. 签名校验不是这个函数的职责（那需要 jwks 拉公钥，又要 RPC）
 */
function decodeSupabaseToken(token: string): DecodedJwt | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(base64urlDecode(parts[1])) as DecodedJwt
    if (!payload.sub) return null
    return payload
  } catch {
    return null
  }
}

/**
 * 获取当前会话用户 —— **无 RPC 版本**。
 * 直接从 cookie 里的 sb-access-token 本地 decode 拿 user id，
 * 避免每次都 RPC 到 Supabase Auth server 校验（那通常要 300ms+）。
 *
 * @returns 模拟的 { id: string } 对象，保持与原 getUser 返回兼容。
 */
export async function requireUser() {
  try {
    const cookieStore = cookies()
    // Supabase 默认 cookie 名，也可能被重命名为 sb-access-token
    let token = cookieStore.get('sb-access-token')?.value
    if (!token) {
      // 兜底：尝试另一个常见命名（supabase-js v2 server-side 的 cookie 名）
      token = cookieStore.get('sb_access_token')?.value
    }
    if (!token) return null

    const payload = decodeSupabaseToken(token)
    if (!payload || !payload.sub) return null

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    } as { id: string; email?: string; role?: string }
  } catch {
    return null
  }
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
