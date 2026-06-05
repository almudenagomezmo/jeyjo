import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@jeyjo/database-types'

import { fetchCustomerDetail } from '@/lib/customers/fetch-customer-detail'
import {
  type ProfileRoleAssignment,
  validateReclassifyInput,
} from '@/lib/customers/reclassify-validation'
import { writeAuditLog } from '@/lib/supabase-server'

export type ReclassifyCustomerInput = {
  supabase: SupabaseClient<Database>
  customerId: string
  customerGroup: number
  profileRoles: ProfileRoleAssignment[]
  actorId: string | number
  actorName: string
}

export type ReclassifyCustomerResult =
  | {
      ok: true
      customerId: string
      customerGroup: number
      profiles: Array<{ id: string; role: string }>
    }
  | {
      ok: false
      status: number
      message: string
    }

export async function reclassifyCustomer(
  input: ReclassifyCustomerInput,
): Promise<ReclassifyCustomerResult> {
  const { supabase, customerId, customerGroup, profileRoles, actorId, actorName } = input

  const detail = await fetchCustomerDetail(supabase, customerId)
  if (!detail) {
    return { ok: false, status: 404, message: 'Customer not found' }
  }

  const validation = validateReclassifyInput({
    customerGroup,
    profileRoles,
    profiles: detail.profiles,
    validatedAt: detail.customer.validated_at,
  })

  if (!validation.ok) {
    return { ok: false, status: validation.status, message: validation.message }
  }

  const existing = detail.customer
  const previousProfiles = detail.profiles.map((p) => ({ id: p.id, role: p.role }))

  const { error: updateCustomerError } = await supabase
    .from('customers')
    .update({ customer_group: customerGroup })
    .eq('id', customerId)

  if (updateCustomerError) {
    return { ok: false, status: 500, message: updateCustomerError.message }
  }

  for (const { profileId, role } of validation.assignments) {
    const { error } = await supabase.from('web_profiles').update({ role }).eq('id', profileId)
    if (error) {
      return { ok: false, status: 500, message: error.message }
    }
  }

  await writeAuditLog({
    actorId,
    actorName,
    entityType: 'customer',
    entityId: customerId,
    action: 'CUSTOMER_RECLASSIFIED',
    previousValue: {
      customer_group: existing.customer_group,
      profiles: previousProfiles,
    },
    metadata: {
      customer_group: customerGroup,
      profiles: validation.assignments,
    },
  })

  return {
    ok: true,
    customerId,
    customerGroup,
    profiles: validation.assignments.map((a) => ({ id: a.profileId, role: a.role })),
  }
}
