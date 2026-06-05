import { NextResponse } from 'next/server'

import {
  authErrorResponse,
  formatValidationFieldErrors,
  mapPostgresError,
  mapSupabaseAuthError,
} from '@/lib/auth/api-errors'
import { registerAuthUserViaMailpit } from '@/lib/auth/register-via-mailpit'
import { registerSchema } from '@/lib/auth/register-schema'
import { getMailpitWebUrl, isMailpitEnabled } from '@/lib/email/mailpit'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseAnonKey, getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/env'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return authErrorResponse(
      { error: 'Petición inválida', details: 'El cuerpo de la solicitud no es JSON válido.', code: 'invalid_json' },
      400,
    )
  }

  const parsed = registerSchema.safeParse(json)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    return NextResponse.json(
      {
        error: 'Revisa los datos del formulario',
        details: formatValidationFieldErrors(fieldErrors),
        fieldErrors,
        code: 'validation_failed',
      },
      { status: 400 },
    )
  }

  const data = { ...parsed.data, email: parsed.data.email.trim().toLowerCase() }
  const missingEnv: string[] = []
  if (!getSupabaseUrl()) missingEnv.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!getSupabaseAnonKey()) missingEnv.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (!getSupabaseServiceRoleKey()) missingEnv.push('SUPABASE_SERVICE_ROLE_KEY')
  if (missingEnv.length > 0) {
    return authErrorResponse(
      {
        error: 'Autenticación no configurada',
        details: `Faltan en apps/storefront/.env o .env.local: ${missingEnv.join(', ')}. Obtén las claves en Supabase Dashboard → Project Settings → API (proyecto tqgrsofvlkyumagrqbqa).`,
        code: 'auth_not_configured',
      },
      503,
    )
  }

  const admin = getSupabaseAdminClient()
  if (!admin) {
    return authErrorResponse(
      {
        error: 'Autenticación no configurada',
        details: 'No se pudo crear el cliente admin de Supabase (revisa SUPABASE_SERVICE_ROLE_KEY).',
        code: 'auth_admin_missing',
      },
      503,
    )
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:3000'
  let userId: string
  let needsEmailConfirmation: boolean
  let devMailpit = false

  if (isMailpitEnabled()) {
    const mailpitResult = await registerAuthUserViaMailpit(admin, {
      email: data.email,
      password: data.password,
      redirectTo: siteUrl,
    })

    if (!mailpitResult.ok) {
      if (mailpitResult.code === 'mailpit_unreachable') {
        return authErrorResponse(
          {
            error: 'Mailpit no está disponible',
            details: mailpitResult.message,
            code: 'mailpit_unreachable',
          },
          503,
        )
      }
      const mapped = mapSupabaseAuthError(mailpitResult.message)
      const status = mapped.code === 'auth_email_rate_limit' ? 429 : 400
      return authErrorResponse(mapped, status)
    }

    userId = mailpitResult.userId
    needsEmailConfirmation = true
    devMailpit = true
  } else {
    const supabase = await createSupabaseServerClient()
    const { data: signUp, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { emailRedirectTo: siteUrl },
    })

    if (signUpError || !signUp.user) {
      const mapped = mapSupabaseAuthError(signUpError?.message)
      const status = mapped.code === 'auth_email_rate_limit' ? 429 : 400
      return authErrorResponse(mapped, status)
    }

    userId = signUp.user.id
    needsEmailConfirmation = !signUp.session
  }

  const { data: customer, error: customerError } = await admin
    .from('customers')
    .insert({
      commercial_name: data.commercialName,
      email: data.email,
      phone: data.phone,
      tax_id: data.isCompany ? data.taxId?.trim() ?? null : data.taxId?.trim() || null,
      is_company: data.isCompany,
      customer_group: 1,
      validated_at: null,
      billing_address_line1: data.billingAddressLine1,
      billing_city: data.billingCity,
      billing_postal_code: data.billingPostalCode,
      billing_country: data.billingCountry,
    })
    .select('id')
    .single()

  if (customerError || !customer) {
    await admin.auth.admin.deleteUser(userId)
    return authErrorResponse(mapPostgresError(customerError?.message, 'customer'), 500)
  }

  const { error: profileError } = await admin.from('web_profiles').insert({
    id: userId,
    customer_id: customer.id,
    email: data.email,
    role: 'pending',
  })

  if (profileError) {
    await admin.from('customers').delete().eq('id', customer.id)
    await admin.auth.admin.deleteUser(userId)
    return authErrorResponse(mapPostgresError(profileError.message, 'profile'), 500)
  }

  const mailpitUrl = getMailpitWebUrl()

  return NextResponse.json({
    ok: true,
    needsEmailConfirmation,
    devMailpit,
    message: devMailpit
      ? `Registro completado. Abre Mailpit (${mailpitUrl}) y confirma tu cuenta desde el correo capturado. Después, Jeyjo validará tu perfil.`
      : needsEmailConfirmation
        ? 'Registro completado. Revisa tu email y confirma la cuenta antes de iniciar sesión. Después, Jeyjo validará tu perfil.'
        : 'Registro completado. Tu cuenta está pendiente de validación por Jeyjo.',
  })
}
