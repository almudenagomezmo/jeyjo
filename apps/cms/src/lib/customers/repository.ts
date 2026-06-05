import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@jeyjo/database-types'

import type { CustomerListRow, CustomerListStatus } from './types'

export type ListCustomersQuery = {
  status?: CustomerListStatus
  group?: number
  search?: string
  page?: number
  limit?: number
}

export function parseListCustomersQuery(url: string): ListCustomersQuery {
  const { searchParams } = new URL(url)
  const status = searchParams.get('status') as CustomerListStatus | null
  const groupRaw = searchParams.get('group')
  const group = groupRaw ? Number(groupRaw) : undefined
  return {
    status: status && ['pending', 'validated', 'all'].includes(status) ? status : 'pending',
    group: group && group >= 1 && group <= 4 ? group : undefined,
    search: searchParams.get('search')?.trim() || undefined,
    page: searchParams.get('page') ? Math.max(1, Number(searchParams.get('page'))) : 1,
    limit: searchParams.get('limit') ? Math.min(100, Math.max(1, Number(searchParams.get('limit')))) : 25,
  }
}

export async function listCustomers(
  supabase: SupabaseClient<Database>,
  query: ListCustomersQuery,
): Promise<{ docs: CustomerListRow[]; totalDocs: number; page: number; limit: number }> {
  const page = query.page ?? 1
  const limit = query.limit ?? 25
  const from = (page - 1) * limit
  const to = from + limit - 1
  const status = query.status ?? 'pending'

  let builder = supabase
    .from('customers')
    .select(
      'id, commercial_name, email, tax_id, phone, customer_group, validated_at, is_company, created_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status === 'pending') {
    builder = builder.is('validated_at', null)
  } else if (status === 'validated') {
    builder = builder.not('validated_at', 'is', null)
  }

  if (query.group) {
    builder = builder.eq('customer_group', query.group)
  }

  if (query.search) {
    const term = `%${query.search}%`
    builder = builder.or(`email.ilike.${term},tax_id.ilike.${term},commercial_name.ilike.${term}`)
  }

  const { data, error, count } = await builder
  if (error) throw new Error(error.message)

  return {
    docs: (data ?? []) as CustomerListRow[],
    totalDocs: count ?? 0,
    page,
    limit,
  }
}
