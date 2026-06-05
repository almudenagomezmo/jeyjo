import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@jeyjo/database-types'

import type { CustomerDetail, WebProfileRow } from './types'

async function isAuthEmailConfirmed(
  supabase: SupabaseClient<Database>,
  profileId: string,
): Promise<boolean> {
  const { data, error } = await supabase.auth.admin.getUserById(profileId)
  if (error || !data.user) return false
  return Boolean(data.user.email_confirmed_at)
}

export async function fetchCustomerDetail(
  supabase: SupabaseClient<Database>,
  customerId: string,
): Promise<CustomerDetail | null> {
  const { data: customer, error } = await supabase
    .from('customers')
    .select(
      'id, commercial_name, legal_name, email, phone, tax_id, is_company, customer_group, validated_at, erp_code, billing_address_line1, billing_city, billing_postal_code, billing_country, created_at',
    )
    .eq('id', customerId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!customer) return null

  const { data: profiles, error: profilesError } = await supabase
    .from('web_profiles')
    .select('id, email, role, is_active, last_login_at, display_name')
    .eq('customer_id', customerId)

  if (profilesError) throw new Error(profilesError.message)

  const enrichedProfiles: WebProfileRow[] = []
  let emailConfirmedForValidation = true

  for (const profile of profiles ?? []) {
    const email_confirmed = await isAuthEmailConfirmed(supabase, profile.id)
    if (!email_confirmed) emailConfirmedForValidation = false
    enrichedProfiles.push({
      id: profile.id,
      email: profile.email,
      role: profile.role,
      is_active: profile.is_active,
      last_login_at: profile.last_login_at,
      display_name: profile.display_name,
      email_confirmed,
    })
  }

  const canValidate = !customer.validated_at && enrichedProfiles.length > 0
  const canReclassify = Boolean(customer.validated_at) && enrichedProfiles.length > 0

  return {
    customer,
    profiles: enrichedProfiles,
    canValidate,
    canReclassify,
    emailConfirmedForValidation,
  }
}
