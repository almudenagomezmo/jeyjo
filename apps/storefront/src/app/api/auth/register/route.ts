import { NextResponse } from 'next/server'

import { registerSchema } from '@/lib/auth/register-schema'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = registerSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const data = parsed.data
  const admin = getSupabaseAdminClient()
  if (!admin) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 503 })
  }

  const supabase = await createSupabaseServerClient()
  const { data: signUp, error: signUpError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  })

  if (signUpError || !signUp.user) {
    return NextResponse.json(
      { error: signUpError?.message ?? 'No se pudo crear la cuenta' },
      { status: 400 },
    )
  }

  const userId = signUp.user.id

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
    return NextResponse.json({ error: customerError?.message ?? 'Error al crear cliente' }, { status: 500 })
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
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    needsEmailConfirmation: !signUp.session,
    message:
      'Registro completado. Tu cuenta está pendiente de validación por Jeyjo. Revisa tu email si se requiere confirmación.',
  })
}
