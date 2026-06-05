import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@jeyjo/database-types'

import type { RealtimeKpis } from '@/lib/dashboard/types'

const ACTIVE_VISITOR_MINUTES = 5
const ACTIVE_CART_MINUTES = 30

export async function fetchRealtimeKpis(
  supabase: SupabaseClient<Database>,
  now = new Date(),
): Promise<RealtimeKpis> {
  const visitorCutoff = new Date(now.getTime() - ACTIVE_VISITOR_MINUTES * 60_000).toISOString()
  const cartCutoff = new Date(now.getTime() - ACTIVE_CART_MINUTES * 60_000).toISOString()

  const [visitorsRes, cartsRes] = await Promise.all([
    supabase
      .from('storefront_sessions')
      .select('session_id', { count: 'exact', head: true })
      .gte('last_seen_at', visitorCutoff),
    supabase
      .from('storefront_cart_activity')
      .select('session_id', { count: 'exact', head: true })
      .gt('line_count', 0)
      .gte('updated_at', cartCutoff),
  ])

  return {
    activeVisitors: visitorsRes.error ? 0 : (visitorsRes.count ?? 0),
    activeCarts: cartsRes.error ? 0 : (cartsRes.count ?? 0),
  }
}
