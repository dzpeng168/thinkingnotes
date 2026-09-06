import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireUser, unauthorized, jsonError } from '@/lib/server/api-helpers'
import type { Note } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NOTE_COLUMNS = 'id,title,template_type,content,file_path,category_id,created_at,updated_at'

/** GET /api/notes/:id — 单条笔记（含 content） */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await requireUser()
  if (!user) return unauthorized()

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('notes')
    .select(NOTE_COLUMNS)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) return jsonError(error.message, 500)
  if (!data) return jsonError('笔记不存在', 404)
  return NextResponse.json(data as Note)
}

/**
 * PATCH /api/notes/:id
 * - { title?, content? }：更新并刷新 updated_at，返回完整 Note（update/rename 共用）
 * - { category_id }：移动分类（无 title/content 时），返回 boolean
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await requireUser()
  if (!user) return unauthorized()

  const body = await request.json().catch(() => null)
  if (!body) return jsonError('请求体无效')

  const admin = createAdminClient()

  // 移动分类（对应原 move_note_to_category）
  if ('category_id' in body && body.title === undefined && body.content === undefined) {
    const categoryId: string | null =
      typeof body.category_id === 'string' && body.category_id ? body.category_id : null
    const { data, error } = await admin
      .from('notes')
      .update({ category_id: categoryId, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select('id')
    if (error) return jsonError(error.message, 500)
    return NextResponse.json((data?.length ?? 0) > 0)
  }

  // 更新标题/正文（对应原 update_note / rename_note）
  const patch: Record<string, string> = {}
  if (typeof body.title === 'string' && body.title.trim()) patch.title = body.title.trim()
  if (typeof body.content === 'string') patch.content = body.content
  if (Object.keys(patch).length === 0) return jsonError('没有可更新的字段')

  const { data, error } = await admin
    .from('notes')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select(NOTE_COLUMNS)
    .single()
  if (error) return jsonError(error.message, 500)
  return NextResponse.json(data as Note)
}

/** DELETE /api/notes/:id — 软删除（置 deleted_at），对应原 delete_note */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await requireUser()
  if (!user) return unauthorized()

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('notes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .select('id')
  if (error) return jsonError(error.message, 500)
  return NextResponse.json((data?.length ?? 0) > 0)
}
