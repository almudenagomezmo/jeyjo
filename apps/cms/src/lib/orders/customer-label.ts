import type { Order } from '@/payload-types'

import { getSupabaseServerClient } from '@/lib/supabase-server'

export type CustomerLabelFields = {
  commercial_name: string
  email: string
  erp_code: string | null
  tax_id: string | null
}

export async function fetchCustomersByIds(
  ids: string[],
): Promise<Map<string, CustomerLabelFields>> {
  const map = new Map<string, CustomerLabelFields>()
  const unique = [...new Set(ids.filter(Boolean))]
  if (!unique.length) return map

  const supabase = getSupabaseServerClient()
  if (!supabase) return map

  const { data } = await supabase
    .from('customers')
    .select('id, commercial_name, email, erp_code, tax_id')
    .in('id', unique)

  for (const row of data ?? []) {
    map.set(row.id, row)
  }
  return map
}

export function resolveCustomerLabel(
  order: Pick<Order, 'guestEmail' | 'customerRef' | 'customerEmail'>,
  customer?: CustomerLabelFields | null,
): string {
  if (customer?.commercial_name) {
    const suffix = customer.tax_id ? ` (${customer.tax_id})` : ''
    return `${customer.commercial_name}${suffix}`
  }
  if (order.guestEmail?.trim()) return order.guestEmail.trim()
  if (order.customerEmail?.trim()) return order.customerEmail.trim()
  if (order.customerRef?.trim()) return order.customerRef.trim()
  return '—'
}
