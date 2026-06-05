import type { Payload } from 'payload'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@jeyjo/database-types'

import { roleForCustomerGroup } from '@/lib/customers/group-labels'
import { sendCustomerApprovalEmail, type ApprovalEmailInput } from '@/lib/customers/emails/approval'
import { fetchCustomerDetail } from '@/lib/customers/fetch-customer-detail'
import { writeAuditLog } from '@/lib/supabase-server'

export type ValidateCustomerInput = {
  payload: Payload
  supabase: SupabaseClient<Database>
  customerId: string
  customerGroup: number
  actorId: string | number
  actorName: string
}

export type ValidateCustomerResult =
  | {
      ok: true
      customerId: string
      customerGroup: number
      role: 'b2c' | 'b2b_superadmin'
      validatedAt: string
      emailSent: boolean
    }
  | {
      ok: false
      status: number
      message: string
    }

export async function validateCustomer(input: ValidateCustomerInput): Promise<ValidateCustomerResult> {
  const { supabase, customerId, customerGroup, payload, actorId, actorName } = input

  if (customerGroup < 1 || customerGroup > 4) {
    return { ok: false, status: 400, message: 'customerGroup must be 1–4' }
  }

  const detail = await fetchCustomerDetail(supabase, customerId)
  if (!detail) {
    return { ok: false, status: 404, message: 'Customer not found' }
  }

  if (detail.customer.validated_at) {
    return { ok: false, status: 409, message: 'Customer already validated' }
  }

  if (!detail.emailConfirmedForValidation) {
    return {
      ok: false,
      status: 422,
      message: 'Email not confirmed. The customer must confirm their email before validation.',
    }
  }

  const existing = detail.customer
  const validatedAt = new Date().toISOString()
  const role = roleForCustomerGroup(customerGroup)

  const { error: updateCustomerError } = await supabase
    .from('customers')
    .update({ customer_group: customerGroup, validated_at: validatedAt })
    .eq('id', customerId)

  if (updateCustomerError) {
    return { ok: false, status: 500, message: updateCustomerError.message }
  }

  if (detail.profiles.length) {
    await supabase.from('web_profiles').update({ role }).eq('customer_id', customerId)
  }

  await writeAuditLog({
    actorId,
    actorName,
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

  const emailInput: ApprovalEmailInput = {
    to: existing.email,
    commercialName: existing.commercial_name,
    customerGroup: customerGroup as ApprovalEmailInput['customerGroup'],
    taxId: existing.tax_id,
    isCompany: existing.is_company,
  }
  const emailSent = await sendCustomerApprovalEmail(payload, emailInput)

  return {
    ok: true,
    customerId,
    customerGroup,
    role,
    validatedAt,
    emailSent,
  }
}
