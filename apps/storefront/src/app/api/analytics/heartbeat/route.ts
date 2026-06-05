import { createHash, randomUUID } from 'crypto'

import { NextResponse } from 'next/server'

import { heartbeatSchema } from '@/lib/analytics/heartbeat-schema'
import { isRateLimited } from '@/lib/analytics/rate-limit'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

const SESSION_COOKIE = 'jeyjo_sid'
const COOKIE_MAX_AGE = 60 * 60 * 24

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

function hashUserAgent(ua: string | null): string | null {
  if (!ua?.trim()) return null
  return createHash('sha256').update(ua.trim()).digest('hex').slice(0, 16)
}

export async function POST(request: Request) {
  const ip = clientIp(request)
  if (isRateLimited(`heartbeat:${ip}`)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = heartbeatSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()
  if (!admin) {
    return NextResponse.json({ error: 'Analytics not configured' }, { status: 503 })
  }

  const cookieSession = request.cookies.get(SESSION_COOKIE)?.value
  const sessionId =
    cookieSession && /^[0-9a-f-]{36}$/i.test(cookieSession) ? cookieSession : randomUUID()
  const now = new Date().toISOString()
  const uaHash = hashUserAgent(request.headers.get('user-agent'))

  const { data: existingSession } = await admin
    .from('storefront_sessions')
    .select('session_id')
    .eq('session_id', sessionId)
    .maybeSingle()

  if (existingSession) {
    const { error: sessionError } = await admin
      .from('storefront_sessions')
      .update({ last_seen_at: now })
      .eq('session_id', sessionId)
    if (sessionError) {
      return NextResponse.json({ error: 'Session persist failed' }, { status: 500 })
    }
  } else {
    const { error: sessionError } = await admin.from('storefront_sessions').insert({
      session_id: sessionId,
      first_seen_at: now,
      last_seen_at: now,
      user_agent_hash: uaHash,
    })
    if (sessionError) {
      return NextResponse.json({ error: 'Session persist failed' }, { status: 500 })
    }
  }

  if (parsed.data.lineCount > 0) {
    const { error: cartError } = await admin.from('storefront_cart_activity').upsert({
      session_id: sessionId,
      line_count: parsed.data.lineCount,
      total_qty: parsed.data.totalQty,
      updated_at: now,
    })
    if (cartError) {
      return NextResponse.json({ error: 'Cart activity persist failed' }, { status: 500 })
    }
  } else {
    await admin.from('storefront_cart_activity').delete().eq('session_id', sessionId)
  }

  const response = NextResponse.json({ ok: true, sessionId })
  if (!cookieSession || cookieSession !== sessionId) {
    response.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    })
  }
  return response
}
