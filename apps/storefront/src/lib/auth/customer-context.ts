import type { Database } from '@jeyjo/database-types'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type CustomerContext = {
  userId: string
  customerId: string
  email: string
  role: Database['public']['Enums']['web_profile_role']
  commercialName: string
  taxId: string | null
  phone: string | null
  customerGroup: number
  validatedAt: string | null
  mfaEnabled: boolean
  isCompany: boolean
  billingAddressLine1: string | null
  billingCity: string | null
  billingPostalCode: string | null
  billingCountry: string | null
}

/** Effective group for pricing: pending B2B uses B2C (group 1) until validated. */
export function pricingCustomerGroup(ctx: CustomerContext | null): number {
  if (!ctx) return 1
  if (!ctx.validatedAt) return 1
  if (ctx.customerGroup >= 2 && ctx.customerGroup <= 4) return ctx.customerGroup
  return 1
}

export function pricingCustomerId(ctx: CustomerContext | null): string | null {
  if (!ctx) return null
  if (!ctx.validatedAt) return null
  if (ctx.customerGroup >= 2 && ctx.customerGroup <= 4) return ctx.customerId
  return null
}

export async function getCustomerContext(userId?: string | null): Promise<CustomerContext | null> {
  if (!isSupabaseConfigured()) return null

  let uid = userId
  if (uid === undefined) {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    uid = user?.id ?? null
  }
  if (!uid) return null

  const admin = getSupabaseAdminClient()
  if (!admin) return null

  const { data: profile } = await admin
    .from('web_profiles')
    .select(
      'id, customer_id, email, role, mfa_enabled, customers!web_profiles_customer_id_fkey ( commercial_name, tax_id, phone, customer_group, validated_at, is_company, billing_address_line1, billing_city, billing_postal_code, billing_country )',
    )
    .eq('id', uid)
    .maybeSingle()

  const customerRow = profile?.customers
  if (!profile || !customerRow || Array.isArray(customerRow)) return null

  const customer = customerRow as {
    commercial_name: string
    tax_id: string | null
    phone: string | null
    customer_group: number
    validated_at: string | null
    is_company: boolean
    billing_address_line1: string | null
    billing_city: string | null
    billing_postal_code: string | null
    billing_country: string | null
  }

  return {
    userId: profile.id,
    customerId: profile.customer_id,
    email: profile.email,
    role: profile.role,
    commercialName: customer.commercial_name,
    taxId: customer.tax_id,
    phone: customer.phone,
    customerGroup: customer.customer_group,
    validatedAt: customer.validated_at,
    mfaEnabled: profile.mfa_enabled,
    isCompany: customer.is_company,
    billingAddressLine1: customer.billing_address_line1,
    billingCity: customer.billing_city,
    billingPostalCode: customer.billing_postal_code,
    billingCountry: customer.billing_country,
  }
}
