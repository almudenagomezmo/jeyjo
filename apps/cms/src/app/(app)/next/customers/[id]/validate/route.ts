import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

import { canValidateCustomers } from '@/access/customerValidation'
import { validateCustomer } from '@/lib/customers/validate-customer'
import { hasValidMfaSession } from '@/lib/mfa-session'
import { getSupabaseServerClient } from '@/lib/supabase-server'

type ValidateBody = {
  customerGroup?: number
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

  const payloadReq = await createLocalReq({ user, req: { headers: requestHeaders } }, payload)
  if (!hasValidMfaSession(payloadReq)) {
    return new Response('MFA required. Completa la verificación MFA en el dashboard.', { status: 403 })
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

  const result = await validateCustomer({
    payload,
    supabase,
    customerId,
    customerGroup,
    actorId: user.id,
    actorName: user.email ?? String(user.id),
  })

  if (!result.ok) {
    return new Response(result.message, { status: result.status })
  }

  return Response.json({
    success: true,
    customerId: result.customerId,
    customerGroup: result.customerGroup,
    role: result.role,
    validatedAt: result.validatedAt,
    emailSent: result.emailSent,
  })
}
