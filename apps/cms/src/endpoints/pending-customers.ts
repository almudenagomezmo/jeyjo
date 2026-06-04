import { APIError, type Endpoint } from 'payload'

import { canValidateCustomers } from '@/access/customerValidation'
import { hasValidMfaSession } from '@/lib/mfa-session'
import { getSupabaseServerClient } from '@/lib/supabase-server'

function assertStaff(req: Parameters<NonNullable<Endpoint['handler']>>[0]) {
  if (!req.user) throw new APIError('Unauthorized', 401)
  if (!canValidateCustomers(req.user)) throw new APIError('Forbidden', 403)
  if (!hasValidMfaSession(req)) throw new APIError('MFA required', 403)
}

export const pendingCustomersEndpoint: Endpoint = {
  path: '/pending-customers',
  method: 'get',
  handler: async (req) => {
    assertStaff(req)

    const supabase = getSupabaseServerClient()
    if (!supabase) {
      throw new APIError('Supabase not configured', 503)
    }

    const { data, error } = await supabase
      .from('customers')
      .select('id, commercial_name, email, tax_id, phone, customer_group, created_at, is_company')
      .is('validated_at', null)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw new APIError(error.message, 500)

    return Response.json({ docs: data ?? [], totalDocs: data?.length ?? 0 })
  },
}
