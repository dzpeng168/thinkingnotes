import type { Note, NoteListItem, Tag, Category } from './types'

/**
 * 数据访问层（Web 版）：Tauri invoke → fetch。
 * 接口签名与返回类型与桌面版完全一致，所有 UI 组件零改动。
 * 后端为 Next.js Route Handlers（app/api/**），服务端按会话 user_id 过滤。
 */

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`/api${path}`, {
      // 禁用 Next.js Data Cache 和浏览器 HTTP 缓存，保证每次返回最新数据
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
      ...init,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new Error(body?.error ?? res.statusText)
    }
    return res.json() as Promise<T>
  } catch (err) {
    console.error(`[API ${path}] error:`, err)
    throw err
  }
}

export const noteApi = {
  // 创建笔记：title + templateType + categoryId，默认内容由 API 按模板注入
  create: (
    title: string,
    templateType: string,
    categoryId?: string | null,
  ): Promise<Note> =>
    call('/notes', {
      method: 'POST',
      body: JSON.stringify({
        title,
        template_type: templateType,
        category_id: categoryId ?? null,
      }),
    }),

  get: (id: string): Promise<Note> => call(`/notes/${id}`),

  list: (): Promise<NoteListItem[]> => call('/notes'),

  // 更新笔记：title/content 任选，同时刷新 updated_at
  update: (
    id: string,
    payload: { title?: string; content?: string },
  ): Promise<Note> =>
    call(`/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  delete: (id: string): Promise<boolean> =>
    call(`/notes/${id}`, { method: 'DELETE' }),

  rename: (id: string, title: string): Promise<Note> =>
    call(`/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    }),

  search: (keyword: string): Promise<NoteListItem[]> =>
    call(`/notes?search=${encodeURIComponent(keyword)}`),

  byTag: (tagId: string): Promise<NoteListItem[]> =>
    call(`/notes?tag=${encodeURIComponent(tagId)}`),

  byCategory: (
    categoryId: string,
    includeSub = true,
  ): Promise<NoteListItem[]> =>
    call(
      `/notes?category=${encodeURIComponent(categoryId)}&includeSub=${includeSub ? 'true' : 'false'}`,
    ),

  moveToCategory: (
    noteId: string,
    categoryId: string | null,
  ): Promise<boolean> =>
    call(`/notes/${noteId}`, {
      method: 'PATCH',
      body: JSON.stringify({ category_id: categoryId }),
    }),
}

export const categoryApi = {
  create: (
    name: string,
    parentId?: string | null,
  ): Promise<Category> =>
    call('/categories', {
      method: 'POST',
      body: JSON.stringify({ name, parent_id: parentId ?? null }),
    }),

  update: (input: {
    id: string
    name?: string
    parent_id?: string | null
    sort_order?: number
  }): Promise<boolean> =>
    call(`/categories/${input.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: input.name,
        parent_id: input.parent_id,
        sort_order: input.sort_order,
      }),
    }),

  delete: (id: string): Promise<boolean> =>
    call(`/categories/${id}`, { method: 'DELETE' }),

  list: (): Promise<Category[]> => call('/categories'),
}

export const tagApi = {
  create: (name: string, color = '#e67e48'): Promise<Tag> =>
    call('/tags', {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    }),

  list: (): Promise<Tag[]> => call('/tags'),

  addToNote: (noteId: string, tagId: string): Promise<boolean> =>
    call(`/notes/${noteId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tag_id: tagId }),
    }),

  removeFromNote: (noteId: string, tagId: string): Promise<boolean> =>
    call(`/notes/${noteId}/tags/${tagId}`, { method: 'DELETE' }),
}

export const trashApi = {
  /** 列出回收站中的笔记 */
  list: (): Promise<NoteListItem[]> => call('/trash'),

  /** 从回收站恢复笔记 */
  restore: (id: string): Promise<boolean> =>
    call(`/trash/${id}/restore`, { method: 'POST' }),

  /** 永久删除笔记（物理删除行，note_tags 级联清理） */
  permanentDelete: (id: string): Promise<boolean> =>
    call(`/trash/${id}`, { method: 'DELETE' }),
}

/** 上传图片附件到 Supabase Storage，返回公开 URL */
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body: form })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? res.statusText)
  }
  const data = await res.json()
  return data.url as string
}

/**
 * 首页启动的一次性数据拉取：合并 notes / tags / categories，
 * 减少 HTTP round-trip 和 auth RPC 次数（3 → 1）。
 */
export async function bootstrap(): Promise<{
  notes: NoteListItem[]
  tags: Tag[]
  categories: Category[]
}> {
  return call('/bootstrap')
}
