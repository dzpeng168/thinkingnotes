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
 */
export async function GET() {
  const user = await requireUser()
  if (!user) return unauthorized()

  const admin = createAdminClient()

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

  if (notesRes.error) return jsonError(notesRes.error.message, 500)
  if (tagsRes.error) return jsonError(tagsRes.error.message, 500)
  if (catsRes.error) return jsonError(catsRes.error.message, 500)

  const notesRaw = (notesRes.data ?? []) as Omit<NoteListItem, 'tags'>[]

  // 批量取标签关联（单次 join 查询，而非 per-note）
  const tagsMap = await getNoteTagsMap(admin, user.id, notesRaw.map((n) => n.id))

  const notes: NoteListItem[] = notesRaw.map((n) => ({
    ...n,
    tags: tagsMap.get(n.id) ?? [],
  }))

  return NextResponse.json({
    notes,
    tags: (tagsRes.data ?? []) as Tag[],
    categories: (catsRes.data ?? []) as Category[],
  })
}
