import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireUser, unauthorized, jsonError } from '@/lib/server/api-helpers'
import type { Category } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CATEGORY_COLUMNS = 'id,name,parent_id,sort_order,created_at,updated_at'

/** GET /api/categories — 全部分类（sort_order asc, name asc） */
export async function GET() {
  const user = await requireUser()
  if (!user) return unauthorized()

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('categories')
    .select(CATEGORY_COLUMNS)
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
  if (error) return jsonError(error.message, 500)
  return NextResponse.json((data ?? []) as Category[])
}

/** POST /api/categories — 创建分类，sort_order = 同级最大 + 1 */
export async function POST(request: NextRequest) {
  const user = await requireUser()
  if (!user) return unauthorized()

  const body = await request.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (!name) return jsonError('分类名称不能为空')
  const parentId: string | null =
    typeof body?.parent_id === 'string' && body.parent_id ? body.parent_id : null

  const admin = createAdminClient()

  // 父分类归属校验
  if (parentId) {
    const { data: parent } = await admin
      .from('categories')
      .select('id')
      .eq('id', parentId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!parent) return jsonError('父分类不存在', 404)
  }

  // 同级（同 parent_id）下当前最大 sort_order + 1
  let nextOrder = 0
  const siblingQuery = admin
    .from('categories')
    .select('sort_order')
    .eq('user_id', user.id)
  const { data: siblings } = parentId
    ? await siblingQuery.eq('parent_id', parentId)
    : await siblingQuery.is('parent_id', null)
  for (const s of siblings ?? []) {
    if ((s as { sort_order: number }).sort_order >= nextOrder) {
      nextOrder = (s as { sort_order: number }).sort_order + 1
    }
  }

  const { data, error } = await admin
    .from('categories')
    .insert({
      user_id: user.id,
      name,
      parent_id: parentId,
      sort_order: nextOrder,
    })
    .select(CATEGORY_COLUMNS)
    .single()
  if (error) return jsonError(error.message, 500)
  return NextResponse.json(data as Category)
}
