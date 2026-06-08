import { NextResponse } from 'next/server'

import { getCustomerContext } from '@/lib/auth/customer-context'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

const MIN_DISPLAY_NAME_LENGTH = 2
const MAX_DISPLAY_NAME_LENGTH = 80

export async function PATCH(request: Request) {
  const ctx = await getCustomerContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { displayName?: string }
  try {
    body = (await request.json()) as { displayName?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const displayName = body.displayName?.trim() ?? ''
  if (displayName.length < MIN_DISPLAY_NAME_LENGTH) {
    return NextResponse.json(
      { error: `El nombre personal debe tener al menos ${MIN_DISPLAY_NAME_LENGTH} caracteres` },
      { status: 422 },
    )
  }
  if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
    return NextResponse.json(
      { error: `El nombre personal no puede superar ${MAX_DISPLAY_NAME_LENGTH} caracteres` },
      { status: 422 },
    )
  }

  const admin = getSupabaseAdminClient()
  if (!admin) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 503 })
  }

  const { data, error } = await admin
    .from('web_profiles')
    .update({ display_name: displayName })
    .eq('id', ctx.userId)
    .select('display_name')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data?.display_name) {
    return NextResponse.json(
      {
        error:
          'No se pudo guardar el nombre personal. Aplica la migración Supabase 20250608150000_web_profiles_display_name_self_update.',
      },
      { status: 500 },
    )
  }

  return NextResponse.json({ displayName: data.display_name })
}
