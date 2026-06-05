import { APIError, type Endpoint } from 'payload'

import { fetchCustomerDetail } from '@/lib/customers/fetch-customer-detail'
import { listCustomers, parseListCustomersQuery } from '@/lib/customers/repository'
import { checkStaffCustomerManagementAccess } from '@/lib/customers/staff-customer-guard'
import { getSupabaseServerClient } from '@/lib/supabase-server'

function assertStaff(req: Parameters<NonNullable<Endpoint['handler']>>[0]) {
  if (!req.user) throw new APIError('Unauthorized', 401)
  const guard = checkStaffCustomerManagementAccess(req.user, req)
  if (guard) throw new APIError(guard.message, guard.status)
}

export const customersAdminListEndpoint: Endpoint = {
  path: '/customers-admin',
  method: 'get',
  handler: async (req) => {
    assertStaff(req)

    const supabase = getSupabaseServerClient()
    if (!supabase) throw new APIError('Supabase not configured', 503)

    const query = parseListCustomersQuery(req.url || '')
    const result = await listCustomers(supabase, query)
    return Response.json(result)
  },
}

export const customersAdminDetailEndpoint: Endpoint = {
  path: '/customers-admin/:id',
  method: 'get',
  handler: async (req) => {
    assertStaff(req)

    const customerId = String(req.routeParams?.id ?? '').trim()
    if (!customerId) throw new APIError('Customer id required', 400)

    const supabase = getSupabaseServerClient()
    if (!supabase) throw new APIError('Supabase not configured', 503)

    const detail = await fetchCustomerDetail(supabase, customerId)
    if (!detail) throw new APIError('Customer not found', 404)

    return Response.json(detail)
  },
}

/** @deprecated Use customersAdminListEndpoint with status=pending */
export const pendingCustomersEndpoint: Endpoint = {
  path: '/pending-customers',
  method: 'get',
  handler: async (req) => {
    assertStaff(req)

    const supabase = getSupabaseServerClient()
    if (!supabase) throw new APIError('Supabase not configured', 503)

    const result = await listCustomers(supabase, { status: 'pending', page: 1, limit: 100 })
    return Response.json({ docs: result.docs, totalDocs: result.totalDocs })
  },
}

export const customersAdminEndpoints = [
  customersAdminListEndpoint,
  customersAdminDetailEndpoint,
  pendingCustomersEndpoint,
]
