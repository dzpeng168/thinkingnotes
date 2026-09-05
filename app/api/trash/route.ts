import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  requireUser,
  unauthorized,
  jsonError,
  getNoteTagsMap,
  NOTE_LIST_COLUMNS,
} from '@/lib/server/api-helpers'
import type { NoteListItem } from '@/lib/types'

export const runtime = 'nodejs'

/** GET /api/trash — 回收站列表（deleted_at 非空，按删除时间倒序） */
export async function GET() {
  const user = await requireUser()
  if (!user) return unauthorized()

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('notes')
    .select(NOTE_LIST_COLUMNS)
    .eq('user_id', user.id)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  if (error) return jsonError(error.message, 500)

  const notes = (data ?? []) as Omit<NoteListItem, 'tags'>[]
  const tagsMap = await getNoteTagsMap(admin, user.id, notes.map((n) => n.id))
  const result: NoteListItem[] = notes.map((n) => ({
    ...n,
    tags: tagsMap.get(n.id) ?? [],
  }))
  return NextResponse.json(result)
}
