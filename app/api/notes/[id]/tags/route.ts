import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireUser, unauthorized, jsonError } from '@/lib/server/api-helpers'

export const runtime = 'nodejs'

/** POST /api/notes/:id/tags — 给笔记打标签（幂等，对应原 add_tag_to_note） */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await requireUser()
  if (!user) return unauthorized()

  const body = await request.json().catch(() => null)
  const tagId = body?.tag_id
  if (typeof tagId !== 'string' || !tagId) return jsonError('缺少 tag_id')

  const admin = createAdminClient()
  // 校验笔记与标签都归属当前用户
  const { data: note } = await admin
    .from('notes')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!note) return jsonError('笔记不存在', 404)
  const { data: tag } = await admin
    .from('tags')
    .select('id')
    .eq('id', tagId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!tag) return jsonError('标签不存在', 404)

  const { error } = await admin
    .from('note_tags')
    .upsert({ note_id: params.id, tag_id: tagId }, { onConflict: 'note_id,tag_id' })
  if (error) return jsonError(error.message, 500)
  return NextResponse.json(true)
}
