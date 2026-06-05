import { hasStaffRole, type StaffUserLike } from '@/access/staffRoles'

import type { DashboardRoleScope, DashboardSummary } from '@/lib/dashboard/types'

export function resolveDashboardRoleScope(user: StaffUserLike | null | undefined): DashboardRoleScope {
  if (hasStaffRole(user, ['superadmin', 'administracion'])) return 'full'
  if (hasStaffRole(user, ['mantenimiento'])) return 'technical'
  return 'minimal'
}

export function filterSummaryByRoleScope(
  summary: DashboardSummary,
  scope: DashboardRoleScope,
): DashboardSummary {
  if (scope === 'full') return summary

  if (scope === 'technical') {
    return {
      ...summary,
      sales: { orderCount: 0, revenue: 0, avgTicket: 0 },
      conversion: { uniqueVisitors: 0, completedOrders: 0, rate: null },
      realtime: { activeVisitors: 0, activeCarts: 0 },
      recentOrders: [],
      eva: { activeConversations: 0, unresolvedQueries: [], isLive: false },
      alerts: summary.alerts.filter(
        (a) => a.id.startsWith('erp-sync') || a.id.startsWith('search-index'),
      ),
      roleScope: scope,
    }
  }

  return {
    ...summary,
    sales: { orderCount: 0, revenue: 0, avgTicket: 0 },
    conversion: { uniqueVisitors: 0, completedOrders: 0, rate: null },
    realtime: { activeVisitors: 0, activeCarts: 0 },
    recentOrders: [],
    eva: { activeConversations: 0, unresolvedQueries: [], isLive: false },
    alerts: summary.alerts.filter(
      (a) =>
        a.id.startsWith('top-sales-low-stock') ||
        a.id.startsWith('erp-sync') ||
        a.id.startsWith('search-index'),
    ),
    roleScope: scope,
  }
}
