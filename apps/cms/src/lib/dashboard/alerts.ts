import type { SupabaseClient } from '@supabase/supabase-js'
import type { Payload } from 'payload'

import { hasStaffRole, type StaffUserLike } from '@/access/staffRoles'
import type { Database } from '@jeyjo/database-types'

import { getLowStockThreshold, aggregateTopSalesSkus } from '@/lib/dashboard/top-sales'
import type { SystemAlert } from '@/lib/dashboard/types'

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
    const threshold = getLowStockThreshold()
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

  const severityRank: Record<SystemAlert['severity'], number> = {
    error: 0,
    warning: 1,
    info: 2,
  }

  return alerts.sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
}
