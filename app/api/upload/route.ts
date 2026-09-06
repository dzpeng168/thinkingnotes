import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireUser, unauthorized, jsonError } from '@/lib/server/api-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
])

const EXT_BY_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
}

/** POST /api/upload — 图片上传到 Storage bucket `attachments`，路径 {user_id}/{uuid}.{ext} */
export async function POST(request: NextRequest) {
  const user = await requireUser()
  if (!user) return unauthorized()

  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) return jsonError('缺少文件')
  if (!ALLOWED_TYPES.has(file.type)) return jsonError('仅支持图片文件（png/jpg/gif/webp/svg/bmp）')

  const ext = EXT_BY_TYPE[file.type] ?? 'png'
  const storagePath = `${user.id}/${uuidv4()}.${ext}`

  const admin = createAdminClient()
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error } = await admin.storage
    .from('attachments')
    .upload(storagePath, buffer, { contentType: file.type, upsert: false })
  if (error) return jsonError(`上传失败: ${error.message}`, 500)

  const { data } = admin.storage.from('attachments').getPublicUrl(storagePath)
  return NextResponse.json({ url: data.publicUrl })
}
