import { NextResponse } from 'next/server'

import { writeCustomerLoginAudit } from '@/lib/auth/audit'
import { getCustomerContext } from '@/lib/auth/customer-context'
import {
  isLoginAttemptBlocked,
  lockoutMessage,
  lockedUntilFromNow,
  nextFailedCount,
  resetLockoutFields,
  shouldLockAccount,
} from '@/lib/auth/lockout'
import { loginRedirectPath, safeNextPath } from '@/lib/auth/redirect'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { extractSourceIp } from '@/lib/request-ip'

export async function POST(request: Request) {
  let body: { email?: string; password?: string; next?: string }
  try {
    body = (await request.json()) as { email?: string; password?: string; next?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  const password = body.password
  if (!email || !password) {
    return NextResponse.json({ error: 'Email y contraseña obligatorios' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()
  if (!admin) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 503 })
  }

  const { data: profileRow } = await admin
    .from('web_profiles')
    .select('id, failed_login_count, locked_until')
    .eq('email', email)
    .maybeSingle()

  if (
    profileRow &&
    isLoginAttemptBlocked(profileRow.failed_login_count ?? 0, profileRow.locked_until)
  ) {
    return NextResponse.json({ error: lockoutMessage() }, { status: 429 })
  }

  if (profileRow) {
    const { data: authUserData, error: authUserError } = await admin.auth.admin.getUserById(profileRow.id)
    if (
      !authUserError &&
      authUserData.user &&
      !authUserData.user.email_confirmed_at
    ) {
      return NextResponse.json(
        {
          error:
            'Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada (y spam) o solicita un nuevo enlace desde Supabase.',
        },
        { status: 403 },
      )
    }
  }

  const supabase = await createSupabaseServerClient()
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.user) {
    if (profileRow) {
      const failed = nextFailedCount(profileRow.failed_login_count ?? 0)
      const update: { failed_login_count: number; locked_until?: string } = {
        failed_login_count: failed,
      }
      if (shouldLockAccount(failed)) {
        update.locked_until = lockedUntilFromNow()
      }
      await admin.from('web_profiles').update(update).eq('id', profileRow.id)
      if (shouldLockAccount(failed)) {
        return NextResponse.json({ error: lockoutMessage() }, { status: 429 })
      }
    }
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
  }

  const userId = authData.user.id
  await admin.from('web_profiles').update({ ...resetLockoutFields(), last_login_at: new Date().toISOString() }).eq('id', userId)

  const ctx = await getCustomerContext(userId)
  if (!ctx) {
    return NextResponse.json({ error: 'Perfil de cliente no encontrado' }, { status: 500 })
  }

  if (!ctx.isActive) {
    await supabase.auth.signOut()
    return NextResponse.json(
      { error: 'Tu cuenta ha sido desactivada. Contacta con el administrador de tu empresa.' },
      { status: 403 },
    )
  }

  const sourceIp = extractSourceIp(request)
  await writeCustomerLoginAudit({
    userId,
    customerId: ctx.customerId,
    email: ctx.email,
    sourceIp,
  })

  const redirectTo = safeNextPath(body.next, loginRedirectPath(ctx))

  return NextResponse.json({ ok: true, redirectTo })
}
