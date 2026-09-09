import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  requireUser,
  unauthorized,
  jsonError,
  getNoteTagsMap,
  NOTE_LIST_COLUMNS,
} from '@/lib/server/api-helpers'
import type { NoteListItem, Tag, Category } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CATEGORY_COLUMNS = 'id,name,parent_id,sort_order,created_at,updated_at'
const TAG_COLUMNS = 'id,name,color,created_at'

/**
 * GET /api/bootstrap — 首页启动的一次性数据拉取
 * 合并 notes / tags / categories，减少 HTTP round-trip 和 auth RPC 次数。
 * 返回: { notes: NoteListItem[], tags: Tag[], categories: Category[] }
 *
 * 性能分析：
 * - requireUser() 每次都 RPC 到 Supabase Auth（getUser），这通常是最大瓶颈
 * - createAdminClient() 每次都新建 Supabase JS client + HTTP 连接池
 * - 三个 DB 查询并行跑，但 admin client 的 fetch 是否共享连接取决于初始化时机
 */
export async function GET() {
  const t0 = performance.now()

  const user = await requireUser()
  if (!user) return unauthorized()
  const t1 = performance.now()

  const admin = createAdminClient()
  const t2 = performance.now()

  // 三个查询并行（共享连接池）
  const [notesRes, tagsRes, catsRes] = await Promise.all([
    admin
      .from('notes')
      .select(NOTE_LIST_COLUMNS)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false }),
    admin
      .from('tags')
      .select(TAG_COLUMNS)
      .eq('user_id', user.id)
      .order('name', { ascending: true }),
    admin
      .from('categories')
      .select(CATEGORY_COLUMNS)
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
  ])
  const t3 = performance.now()

  if (notesRes.error) return jsonError(notesRes.error.message, 500)
  if (tagsRes.error) return jsonError(tagsRes.error.message, 500)
  if (catsRes.error) return jsonError(catsRes.error.message, 500)

  const notesRaw = (notesRes.data ?? []) as Omit<NoteListItem, 'tags'>[]

  // 批量取标签关联（单次 join 查询）
  const tagsMap = await getNoteTagsMap(admin, user.id, notesRaw.map((n) => n.id))
  const t4 = performance.now()

  const notes: NoteListItem[] = notesRaw.map((n) => ({
    ...n,
    tags: tagsMap.get(n.id) ?? [],
  }))

  const totalMs = Math.round(performance.now() - t0)
  const profile = {
    totalMs,
    authMs: Math.round(t1 - t0),
    clientInitMs: Math.round(t2 - t1),
    dbQueryMs: Math.round(t3 - t2),
    tagsMapMs: Math.round(t4 - t3),
    noteCount: notes.length,
    tagCount: (tagsRes.data ?? []).length,
    catCount: (catsRes.data ?? []).length,
  }
  console.log('[bootstrap profile]', JSON.stringify(profile))

  const resp = NextResponse.json({
    notes,
    tags: (tagsRes.data ?? []) as Tag[],
    categories: (catsRes.data ?? []) as Category[],
  })
  // 把 profile 塞进响应头，方便浏览器 Network 面板直接查看
  resp.headers.set('x-bootstrap-profile', JSON.stringify(profile))
  return resp
}
