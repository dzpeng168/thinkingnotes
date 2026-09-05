import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireUser, unauthorized, jsonError } from '@/lib/server/api-helpers'

export const runtime = 'nodejs'

/** DELETE /api/trash/:id — 永久删除（物理 DELETE，note_tags 级联清理） */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await requireUser()
  if (!user) return unauthorized()

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('notes')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select('id')
  if (error) return jsonError(error.message, 500)
  return NextResponse.json((data?.length ?? 0) > 0)
}
