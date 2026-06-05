import type { Payload } from 'payload'

import { buildEvaPanel } from '@/lib/dashboard/eva-panel'
import { aggregateConversion, fetchUniqueVisitors } from '@/lib/dashboard/conversion'
import { periodToIsoRange, resolveDashboardPeriod } from '@/lib/dashboard/period'
import { fetchRealtimeKpis } from '@/lib/dashboard/realtime'
import { buildRecentOrders } from '@/lib/dashboard/recent-orders'
import { filterSummaryByRoleScope, resolveDashboardRoleScope } from '@/lib/dashboard/role-scope'
import { fetchSalesKpis } from '@/lib/dashboard/sales-kpis'
import { buildSystemAlerts } from '@/lib/dashboard/alerts'
import type { DashboardSummary } from '@/lib/dashboard/types'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import type { StaffUserLike } from '@/access/staffRoles'
import { getSearchQueueStats } from '@/search-indexer/queueStats'
import { getQdrantCoverageStats } from '@/search-indexer/qdrantCoverage'

export async function buildDashboardSummary(input: {
  payload: Payload
  user: StaffUserLike | null | undefined
  period?: string | null
  from?: string | null
  to?: string | null
}): Promise<DashboardSummary> {
  const resolved = resolveDashboardPeriod({
    period: input.period,
    from: input.from,
    to: input.to,
  })
  const { from, to } = periodToIsoRange(resolved)
  const supabase = getSupabaseServerClient()

  const [sales, uniqueVisitors, realtime, recentOrders, eva, alerts, searchQueue, qdrantCoverage] =
    await Promise.all([
    fetchSalesKpis(input.payload, from, to),
    supabase ? fetchUniqueVisitors(supabase, from, to) : Promise.resolve(0),
    supabase ? fetchRealtimeKpis(supabase) : Promise.resolve({ activeVisitors: 0, activeCarts: 0 }),
    buildRecentOrders(input.payload),
    buildEvaPanel(input.payload),
    buildSystemAlerts({ payload: input.payload, supabase, user: input.user }),
    getSearchQueueStats(supabase),
    getQdrantCoverageStats(input.payload),
  ])

  const conversion = aggregateConversion(uniqueVisitors, sales.orderCount)
  const roleScope = resolveDashboardRoleScope(input.user)

  const summary: DashboardSummary = {
    period: { from, to, label: resolved.label },
    sales,
    conversion,
    realtime,
    recentOrders,
    eva,
    alerts,
    searchQueue,
    qdrantCoverage,
    roleScope,
  }

  return filterSummaryByRoleScope(summary, roleScope)
}
