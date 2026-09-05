import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireUser, unauthorized, jsonError } from '@/lib/server/api-helpers'
import type { Tag } from '@/lib/types'

export const runtime = 'nodejs'

const TAG_COLUMNS = 'id,name,color,created_at'

/** GET /api/tags — 全部标签（按名称排序） */
export async function GET() {
  const user = await requireUser()
  if (!user) return unauthorized()

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('tags')
    .select(TAG_COLUMNS)
    .eq('user_id', user.id)
    .order('name', { ascending: true })
  if (error) return jsonError(error.message, 500)
  return NextResponse.json((data ?? []) as Tag[])
}

/** POST /api/tags — 创建标签；同用户重名报 409 */
export async function POST(request: NextRequest) {
  const user = await requireUser()
  if (!user) return unauthorized()

  const body = await request.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (!name) return jsonError('标签名称不能为空')
  const color = typeof body?.color === 'string' && body.color ? body.color : '#e67e48'

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('tags')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', name)
    .maybeSingle()
  if (existing) return jsonError('标签已存在', 409)

  const { data, error } = await admin
    .from('tags')
    .insert({ user_id: user.id, name, color })
    .select(TAG_COLUMNS)
    .single()
  if (error) return jsonError(error.message, 500)
  return NextResponse.json(data as Tag)
}
