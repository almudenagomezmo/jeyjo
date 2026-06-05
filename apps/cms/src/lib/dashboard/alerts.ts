import type { SupabaseClient } from '@supabase/supabase-js'
import type { Payload } from 'payload'

import { hasStaffRole, type StaffUserLike } from '@/access/staffRoles'
import type { Database } from '@jeyjo/database-types'

import { getOperationalThresholds, aggregateTopSalesSkus } from '@/lib/dashboard/top-sales'
import type { SystemAlert } from '@/lib/dashboard/types'
import { getSearchQueueStats } from '@/search-indexer/queueStats'

const ERP_ALERT_HOURS = 24

export async function buildSystemAlerts(input: {
  payload: Payload
  supabase: SupabaseClient<Database> | null
  user: StaffUserLike | null | undefined
  now?: Date
}): Promise<SystemAlert[]> {
  const { payload, supabase, user } = input
  const now = input.now ?? new Date()
  const alerts: SystemAlert[] = []
  const cutoff = new Date(now.getTime() - ERP_ALERT_HOURS * 60 * 60 * 1000).toISOString()

  const showErp = hasStaffRole(user, ['superadmin', 'administracion', 'mantenimiento'])
  const showPendingCustomers = hasStaffRole(user, ['superadmin', 'administracion'])
  const showTopSales = hasStaffRole(user, ['superadmin', 'administracion', 'catalogo'])
  const showAnalytics = hasStaffRole(user, ['superadmin', 'mantenimiento'])
  const showSearchOps = hasStaffRole(user, ['superadmin', 'mantenimiento', 'catalogo'])

  if (showSearchOps && supabase) {
    try {
      const queue = await getSearchQueueStats(supabase)
      const lag = queue.oldestPendingAgeSec

      if (queue.error >= 10 || lag > 900) {
        alerts.push({
          id: 'search-index-queue-error',
          severity: 'error',
          title: 'Cola de indexación de búsqueda degradada',
          description: `${queue.error} error(es), ${queue.pending} pendiente(s), lag ${lag}s`,
          timestamp: now.toISOString(),
          href: '/admin/pim-health',
        })
      } else if (queue.error > 0 || lag > 300) {
        alerts.push({
          id: 'search-index-queue-warning',
          severity: 'warning',
          title: 'Retraso en indexación Qdrant',
          description: `${queue.error} error(es), ${queue.pending} pendiente(s), lag ${lag}s`,
          timestamp: now.toISOString(),
          href: '/admin/pim-health',
        })
      }
    } catch {
      // queue stats unavailable during bootstrap
    }
  }

  if (showErp && supabase) {
    const { data: syncRuns } = await supabase
      .from('erp_sync_runs')
      .select('id, status, error_summary, started_at')
      .gte('started_at', cutoff)
      .order('started_at', { ascending: false })
      .limit(1)

    const latest = syncRuns?.[0]
    if (latest && (latest.status === 'failed' || latest.status === 'partial')) {
      alerts.push({
        id: 'erp-sync-latest',
        severity: 'error',
        title: 'Error de sincronización ERP',
        description: latest.error_summary?.trim() || `Última ejecución: ${latest.status}`,
        timestamp: latest.started_at,
        href: '/admin/pim-health',
      })
    }

    const { data: auditErrors } = await supabase
      .from('audit_log')
      .select('id, created_at, new_value')
      .eq('entity_type', 'erp_sync')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(20)

    const auditErr = (auditErrors ?? []).find((row) => {
      const meta = row.new_value as { status?: string } | null
      return meta?.status === 'error_erp'
    })
    if (auditErr && !alerts.some((a) => a.id === 'erp-sync-latest')) {
      alerts.push({
        id: 'erp-sync-audit',
        severity: 'error',
        title: 'Error de sincronización ERP (auditoría)',
        description: 'Se registró un error ERP en las últimas 24 h.',
        timestamp: auditErr.created_at,
        href: '/admin/audit-log',
      })
    }
  }

  if (showPendingCustomers && supabase) {
    const { count } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .is('validated_at', null)

    const pending = count ?? 0
    if (pending > 0) {
      alerts.push({
        id: 'pending-customers',
        severity: 'warning',
        title: 'Clientes pendientes de validar',
        description: `${pending} registro(s) esperan validación.`,
        timestamp: now.toISOString(),
        href: '/admin/pending-customers',
      })
    }
  }

  if (showTopSales) {
    const { dashboardLowStockThreshold: threshold } = await getOperationalThresholds(payload)
    const topSkus = await aggregateTopSalesSkus(payload, now, 10)
    for (const row of topSkus) {
      if (row.availableStock >= threshold) continue
      const productHref = row.productId
        ? `/admin/collections/products/${row.productId}`
        : null
      alerts.push({
        id: `top-sales-low-stock-${row.skuErp}`,
        severity: 'warning',
        title: 'Top ventas con stock bajo',
        description: `${row.productTitle ?? row.skuErp}: ${row.availableStock} uds. (umbral ${threshold})`,
        timestamp: now.toISOString(),
        href: productHref,
      })
    }
  }

  if (showAnalytics) {
    try {
      const analytics = await payload.findGlobal({ slug: 'analyticsSettings', overrideAccess: true })
      const failures = analytics.consecutiveFeedFailures ?? 0
      if (failures >= 2) {
        alerts.push({
          id: 'merchant-feed-cron',
          severity: 'error',
          title: 'Error de generación del feed Merchant Center',
          description:
            analytics.lastFeedErrorMessage?.trim() ||
            `El cron del feed ha fallado ${failures} veces consecutivas.`,
          timestamp: analytics.lastFeedErrorAt ?? now.toISOString(),
          href: '/admin/analytics-config',
        })
      }
    } catch {
      // analytics global may not exist yet during bootstrap
    }
  }

  const severityRank: Record<SystemAlert['severity'], number> = {
    error: 0,
    warning: 1,
    info: 2,
  }

  return alerts.sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
}
