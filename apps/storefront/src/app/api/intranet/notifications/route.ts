import { NextResponse } from 'next/server'

import { requireB2bApiSession } from '@/lib/intranet/b2b-api-guard'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { NotificationItem } from '@/lib/notifications/types'

function mapRow(row: {
  id: string
  type: string
  title: string
  body: string | null
  payload: unknown
  read_at: string | null
  created_at: string
}): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    payload: (row.payload && typeof row.payload === 'object' ? row.payload : {}) as Record<
      string,
      unknown
    >,
    readAt: row.read_at,
    createdAt: row.created_at,
  }
}

export async function GET(request: Request) {
  const guard = await requireB2bApiSession()
  if ('error' in guard) return guard.error

  const url = new URL(request.url)
  const unreadOnly = url.searchParams.get('unreadOnly') === 'true'
  const limit = Math.min(50, Math.max(1, Number.parseInt(url.searchParams.get('limit') ?? '20', 10)))

  const supabase = await createSupabaseServerClient()
  let query = supabase
    .from('notifications')
    .select('id, type, title, body, payload, read_at, created_at', { count: 'exact' })
    .eq('web_profile_id', guard.ctx.userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (unreadOnly) {
    query = query.is('read_at', null)
  }

  const { data, error, count } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('web_profile_id', guard.ctx.userId)
    .is('read_at', null)

  return NextResponse.json({
    items: (data ?? []).map(mapRow),
    total: count ?? 0,
    unreadCount: unreadCount ?? 0,
  })
}

export async function PATCH(request: Request) {
  const guard = await requireB2bApiSession()
  if ('error' in guard) return guard.error

  const body = (await request.json()) as { ids?: string[]; markAll?: boolean }
  const now = new Date().toISOString()
  const supabase = await createSupabaseServerClient()

  if (body.markAll) {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('web_profile_id', guard.ctx.userId)
      .is('read_at', null)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  const ids = Array.isArray(body.ids) ? body.ids.filter((id) => typeof id === 'string') : []
  if (ids.length === 0) {
    return NextResponse.json({ error: 'ids or markAll required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: now })
    .eq('web_profile_id', guard.ctx.userId)
    .in('id', ids)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
