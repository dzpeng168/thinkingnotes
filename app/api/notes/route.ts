import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  requireUser,
  unauthorized,
  jsonError,
  getNoteTagsMap,
  collectSubCategoryIds,
  NOTE_LIST_COLUMNS,
} from '@/lib/server/api-helpers'
import { defaultMarkdownFor, isTemplateType } from '@/lib/server/templates'
import type { Note, NoteListItem } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/notes
 * - 无参：全部笔记（排除回收站，updated_at desc）
 * - ?search=kw：标题或正文 ILIKE
 * - ?tag=tagId：按标签筛选
 * - ?category=id&includeSub=true：按分类（含子分类）
 */
export async function GET(request: NextRequest) {
  const user = await requireUser()
  if (!user) return unauthorized()

  const admin = createAdminClient()
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.trim()
  const tag = searchParams.get('tag')?.trim()
  const category = searchParams.get('category')?.trim()
  const includeSub = searchParams.get('includeSub') !== 'false'

  const base = () =>
    admin
      .from('notes')
      .select(NOTE_LIST_COLUMNS)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })

  let query: ReturnType<typeof base>

  if (search) {
    // PostgREST or 过滤：kw 中的分隔符做清理，避免语法注入
    const kw = search.replace(/[,()*]/g, ' ').trim()
    query = base()
    if (kw) {
      query = query.or(`title.ilike.*${kw}*,content.ilike.*${kw}*`)
    }
  } else if (tag) {
    const { data: links } = await admin
      .from('note_tags')
      .select('note_id, tags(user_id)')
      .eq('tag_id', tag)
    // 防御：仅当前用户标签关联的笔记（正常数据必然如此）
    const noteIds = (links ?? [])
      .filter((row) => {
        const tags = row.tags as unknown
        const owner = Array.isArray(tags)
          ? (tags[0] as { user_id?: string } | undefined)?.user_id
          : (tags as { user_id?: string } | null | undefined)?.user_id
        return owner === user.id
      })
      .map((row) => row.note_id as string)
    query = base().in('id', noteIds.length > 0 ? noteIds : ['00000000-0000-0000-0000-000000000000'])
  } else if (category) {
    let ids = [category]
    if (includeSub) {
      const { data: cats } = await admin
        .from('categories')
        .select('id,parent_id')
        .eq('user_id', user.id)
      ids = collectSubCategoryIds(cats ?? [], category)
    }
    query = base().in('category_id', ids)
  } else {
    query = base()
  }

  const { data, error } = await query
  if (error) return jsonError(error.message, 500)

  const notes = (data ?? []) as Omit<NoteListItem, 'tags'>[]
  const tagsMap = await getNoteTagsMap(admin, user.id, notes.map((n) => n.id))
  const result: NoteListItem[] = notes.map((n) => ({
    ...n,
    tags: tagsMap.get(n.id) ?? [],
  }))
  return NextResponse.json(result)
}

/**
 * POST /api/notes — 创建笔记
 * body: { title, template_type, category_id? }；空标题 → 未命名；按模板注入默认 markdown
 */
export async function POST(request: NextRequest) {
  const user = await requireUser()
  if (!user) return unauthorized()

  const body = await request.json().catch(() => null)
  if (!body || typeof body.template_type !== 'string') {
    return jsonError('缺少 template_type')
  }
  if (!isTemplateType(body.template_type)) {
    return jsonError('无效的模板类型')
  }
  const title: string =
    typeof body.title === 'string' && body.title.trim() ? body.title.trim() : '未命名'
  const categoryId: string | null =
    typeof body.category_id === 'string' && body.category_id ? body.category_id : null

  const content = await defaultMarkdownFor(body.template_type)

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('notes')
    .insert({
      user_id: user.id,
      title,
      template_type: body.template_type,
      content,
      category_id: categoryId,
      file_path: null,
    })
    .select('id,title,template_type,content,file_path,category_id,created_at,updated_at')
    .single()
  if (error) return jsonError(error.message, 500)
  return NextResponse.json(data as Note)
}
