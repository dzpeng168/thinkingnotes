import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireUser, unauthorized, jsonError } from '@/lib/server/api-helpers'

export const runtime = 'nodejs'

/** DELETE /api/notes/:id/tags/:tagId — 移除笔记标签（对应原 remove_tag_from_note） */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; tagId: string } },
) {
  const user = await requireUser()
  if (!user) return unauthorized()

  const admin = createAdminClient()
  // 经 notes 归属校验（note_tags 无 user_id）
  const { data: note } = await admin
    .from('notes')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!note) return jsonError('笔记不存在', 404)

  const { error } = await admin
    .from('note_tags')
    .delete()
    .eq('note_id', params.id)
    .eq('tag_id', params.tagId)
  if (error) return jsonError(error.message, 500)
  return NextResponse.json(true)
}
