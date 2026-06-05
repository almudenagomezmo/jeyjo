import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

import { checkStaffCustomerManagementAccess } from '@/lib/customers/staff-customer-guard'
import {
  reclassifyCustomer,
  type ReclassifyCustomerInput,
} from '@/lib/customers/reclassify-customer'
import { getSupabaseServerClient } from '@/lib/supabase-server'

type ReclassifyBody = {
  customerGroup?: number
  profileRoles?: Array<{ profileId?: string; role?: string }>
}

/**
 * Staff-only: reclassify validated customer group and profile roles.
 * PATCH /next/customers/:id/reclassify
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id: customerId } = await context.params

  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })
  if (!user) {
    return new Response('Action forbidden.', { status: 403 })
  }

  const payloadReq = await createLocalReq({ user, req: { headers: requestHeaders } }, payload)
  const guard = checkStaffCustomerManagementAccess(user, payloadReq)
  if (guard) {
    return new Response(guard.message, { status: guard.status })
  }

  let body: ReclassifyBody
  try {
    body = (await request.json()) as ReclassifyBody
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const customerGroup = body.customerGroup
  if (!customerGroup || customerGroup < 1 || customerGroup > 4) {
    return new Response('customerGroup must be 1–4', { status: 400 })
  }

  const profileRoles = (body.profileRoles ?? [])
    .filter((row) => row.profileId && row.role)
    .map((row) => ({
      profileId: String(row.profileId),
      role: String(row.role),
    }))

  const supabase = getSupabaseServerClient()
  if (!supabase) {
    return new Response('Supabase not configured', { status: 503 })
  }

  const result = await reclassifyCustomer({
    supabase,
    customerId,
    customerGroup,
    profileRoles,
    actorId: user.id,
    actorName: user.email ?? String(user.id),
  } satisfies ReclassifyCustomerInput)

  if (!result.ok) {
    return new Response(result.message, { status: result.status })
  }

  return Response.json({
    success: true,
    customerId: result.customerId,
    customerGroup: result.customerGroup,
    profiles: result.profiles,
  })
}
