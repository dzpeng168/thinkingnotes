import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireUser, unauthorized, jsonError } from '@/lib/server/api-helpers'

export const runtime = 'nodejs'

/** POST /api/trash/:id/restore — 从回收站恢复（置 deleted_at = NULL） */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await requireUser()
  if (!user) return unauthorized()

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('notes')
    .update({ deleted_at: null })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .not('deleted_at', 'is', null)
    .select('id')
  if (error) return jsonError(error.message, 500)
  return NextResponse.json((data?.length ?? 0) > 0)
}
