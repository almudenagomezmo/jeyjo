import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

import { canValidateCustomers } from '@/access/customerValidation'
import { hasValidMfaSession } from '@/lib/mfa-session'
import { getSupabaseServerClient, writeAuditLog } from '@/lib/supabase-server'

type ValidateBody = {
  customerGroup?: number
}

function roleForGroup(group: number): 'b2c' | 'b2b_superadmin' {
  return group === 1 ? 'b2c' : 'b2b_superadmin'
}

/**
 * Staff-only: validate pending customer registration (RF-004).
 * POST /next/customers/:id/validate — Payload admin session required.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id: customerId } = await context.params

  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || !canValidateCustomers(user)) {
    return new Response('Action forbidden.', { status: 403 })
  }

  const payloadReq = await createLocalReq({ user }, payload)
  if (!hasValidMfaSession(payloadReq)) {
    return new Response('MFA required.', { status: 403 })
  }

  let body: ValidateBody
  try {
    body = (await request.json()) as ValidateBody
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const customerGroup = body.customerGroup
  if (!customerGroup || customerGroup < 1 || customerGroup > 4) {
    return new Response('customerGroup must be 1–4', { status: 400 })
  }

  const supabase = getSupabaseServerClient()
  if (!supabase) {
    return new Response('Supabase not configured', { status: 503 })
  }

  const { data: existing, error: fetchError } = await supabase
    .from('customers')
    .select('id, customer_group, validated_at')
    .eq('id', customerId)
    .maybeSingle()

  if (fetchError || !existing) {
    return new Response('Customer not found', { status: 404 })
  }

  if (existing.validated_at) {
    return new Response('Customer already validated', { status: 409 })
  }

  const validatedAt = new Date().toISOString()
  const role = roleForGroup(customerGroup)

  const { error: updateCustomerError } = await supabase
    .from('customers')
    .update({ customer_group: customerGroup, validated_at: validatedAt })
    .eq('id', customerId)

  if (updateCustomerError) {
    return new Response(updateCustomerError.message, { status: 500 })
  }

  const { data: profiles } = await supabase
    .from('web_profiles')
    .select('id')
    .eq('customer_id', customerId)

  if (profiles?.length) {
    await supabase.from('web_profiles').update({ role }).eq('customer_id', customerId)
  }

  await writeAuditLog({
    actorId: user.id,
    actorName: user.email ?? String(user.id),
    entityType: 'customer',
    entityId: customerId,
    action: 'CUSTOMER_VALIDATED',
    previousValue: {
      customer_group: existing.customer_group,
      validated_at: existing.validated_at,
    },
    metadata: {
      customer_group: customerGroup,
      validated_at: validatedAt,
      role,
    },
  })

  return Response.json({ success: true, customerId, customerGroup, role, validatedAt })
}
