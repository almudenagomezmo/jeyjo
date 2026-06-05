import { describe, expect, it } from 'vitest'

import { buildSystemAlerts } from '@/lib/dashboard/alerts'
import { aggregateConversion } from '@/lib/dashboard/conversion'
import { filterSummaryByRoleScope, resolveDashboardRoleScope } from '@/lib/dashboard/role-scope'
import { aggregateSalesKpisFromOrders } from '@/lib/dashboard/sales-kpis'
import type { DashboardSummary } from '@/lib/dashboard/types'

describe('dashboard sales aggregation', () => {
  it('counts revenue and average ticket for qualifying orders', () => {
    const kpis = aggregateSalesKpisFromOrders([
      { amount: 100, jeyjoStatus: 'confirmed', paymentStatus: 'authorized' },
      { amount: 50, jeyjoStatus: 'pending_payment', paymentStatus: 'pending' },
      { amount: 200, jeyjoStatus: 'cancelled', paymentStatus: 'authorized' },
      { amount: 75, jeyjoStatus: 'confirmed', paymentStatus: 'failed' },
    ])
    expect(kpis.orderCount).toBe(2)
    expect(kpis.revenue).toBe(150)
    expect(kpis.avgTicket).toBe(75)
  })
})

describe('dashboard conversion', () => {
  it('returns null rate when visitors are zero', () => {
    const result = aggregateConversion(0, 3)
    expect(result.rate).toBeNull()
    expect(result.completedOrders).toBe(3)
  })

  it('computes rate when visitors exist', () => {
    const result = aggregateConversion(100, 5)
    expect(result.rate).toBe(0.05)
  })
})

describe('dashboard role scope', () => {
  const baseSummary: DashboardSummary = {
    period: { from: 'a', to: 'b', label: 'Hoy' },
    sales: { orderCount: 2, revenue: 120, avgTicket: 60 },
    conversion: { uniqueVisitors: 10, completedOrders: 2, rate: 0.2 },
    realtime: { activeVisitors: 1, activeCarts: 1 },
    recentOrders: [],
    eva: { activeConversations: 0, unresolvedQueries: [], isLive: false },
    alerts: [
      {
        id: 'erp-sync-latest',
        severity: 'error',
        title: 'ERP',
        description: 'x',
        timestamp: null,
        href: null,
      },
      {
        id: 'pending-customers',
        severity: 'warning',
        title: 'Pending',
        description: 'x',
        timestamp: null,
        href: null,
      },
    ],
    roleScope: 'full',
  }

  it('catalogo gets minimal scope without revenue fields', () => {
    expect(resolveDashboardRoleScope({ staffRoles: ['catalogo'] })).toBe('minimal')
    const filtered = filterSummaryByRoleScope(baseSummary, 'minimal')
    expect(filtered.sales.revenue).toBe(0)
    expect(filtered.recentOrders).toHaveLength(0)
    expect(filtered.alerts.some((a) => a.id === 'pending-customers')).toBe(false)
  })

  it('mantenimiento keeps only erp alerts', () => {
    const filtered = filterSummaryByRoleScope(baseSummary, 'technical')
    expect(filtered.alerts).toHaveLength(1)
    expect(filtered.alerts[0]?.id).toBe('erp-sync-latest')
  })
})

describe('dashboard ERP alert builder', () => {
  it('flags failed erp_sync_runs via supabase mock', async () => {
    const supabase = {
      from: (table: string) => {
        if (table === 'erp_sync_runs') {
          return {
            select: () => ({
              gte: () => ({
                order: () => ({
                  limit: async () => ({
                    data: [
                      {
                        id: 'run-1',
                        status: 'failed',
                        error_summary: 'timeout',
                        started_at: new Date().toISOString(),
                      },
                    ],
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'audit_log') {
          return {
            select: () => ({
              eq: () => ({
                gte: () => ({
                  order: () => ({
                    limit: async () => ({ data: [] }),
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'customers') {
          return {
            select: () => ({
              is: async () => ({ count: 0 }),
            }),
          }
        }
        return {
          select: () => ({
            is: async () => ({ count: 0 }),
          }),
        }
      },
    }

    const alerts = await buildSystemAlerts({
      payload: {
        find: async () => ({ docs: [] }),
      } as never,
      supabase: supabase as never,
      user: { staffRoles: ['superadmin'] },
    })

    expect(alerts.some((a) => a.id === 'erp-sync-latest')).toBe(true)
  })
})
