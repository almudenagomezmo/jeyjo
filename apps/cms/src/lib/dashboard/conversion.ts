import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@jeyjo/database-types'

import type { ConversionKpis } from '@/lib/dashboard/types'

export function aggregateConversion(
  uniqueVisitors: number,
  completedOrders: number,
): ConversionKpis {
  const rate =
    uniqueVisitors > 0 ? Math.round((completedOrders / uniqueVisitors) * 10000) / 10000 : null
  return { uniqueVisitors, completedOrders, rate }
}

export async function fetchUniqueVisitors(
  supabase: SupabaseClient<Database>,
  fromIso: string,
  toIso: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('storefront_sessions')
    .select('session_id', { count: 'exact', head: true })
    .gte('first_seen_at', fromIso)
    .lte('first_seen_at', toIso)

  if (error) return 0
  return count ?? 0
}
