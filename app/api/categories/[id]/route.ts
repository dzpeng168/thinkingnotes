import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireUser, unauthorized, jsonError } from '@/lib/server/api-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** 判断 descendant 是否为 ancestor 的后代（沿 parent 链上溯，防环路） */
function isDescendant(
  categories: { id: string; parent_id: string | null }[],
  ancestorId: string,
  descendantId: string,
): boolean {
  const byId = new Map(categories.map((c) => [c.id, c]))
  let cur = byId.get(descendantId)
  while (cur) {
    if (cur.id === ancestorId) return true
    cur = cur.parent_id ? byId.get(cur.parent_id) : undefined
  }
  return false
}

/**
 * PATCH /api/categories/:id — 更新分类
 * body: { name?, parent_id?, sort_order? }；改名不再搬移任何文件（Web 无文件系统）
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
  const { data: existing } = await admin
    .from('categories')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!existing) return jsonError('分类不存在', 404)

  const patch: Record<string, unknown> = {}

  if (typeof body.name === 'string') {
    const name = body.name.trim()
    if (!name) return jsonError('分类名称不能为空')
    patch.name = name
  }

  if ('parent_id' in body && body.parent_id !== undefined) {
    const newParent: string | null =
      typeof body.parent_id === 'string' && body.parent_id ? body.parent_id : null
    if (newParent) {
      if (newParent === params.id) {
        return jsonError('不能把分类设为自己的子分类')
      }
      const { data: cats } = await admin
        .from('categories')
        .select('id,parent_id')
        .eq('user_id', user.id)
      if (isDescendant(cats ?? [], params.id, newParent)) {
        return jsonError('不能把分类移到自己的子分类下（会形成环路）')
      }
    }
    patch.parent_id = newParent
  }

  if (typeof body.sort_order === 'number' && Number.isFinite(body.sort_order)) {
    patch.sort_order = body.sort_order
  }

  if (Object.keys(patch).length === 0) return jsonError('没有可更新的字段')

  const { data, error } = await admin
    .from('categories')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select('id')
  if (error) return jsonError(error.message, 500)
  return NextResponse.json((data?.length ?? 0) > 0)
}

/** DELETE /api/categories/:id — 子分类级联删除、笔记归未分类（FK 已保证） */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await requireUser()
  if (!user) return unauthorized()

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('categories')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select('id')
  if (error) return jsonError(error.message, 500)
  return NextResponse.json((data?.length ?? 0) > 0)
}
