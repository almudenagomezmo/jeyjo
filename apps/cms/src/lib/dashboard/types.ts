import type { StaffRole } from '@/access/staffRoles'

export type DashboardPeriodPreset = 'today' | 'yesterday' | 'week' | 'month' | 'custom'

export type ResolvedPeriod = {
  preset: DashboardPeriodPreset
  from: Date
  to: Date
  label: string
}

export type DashboardRoleScope = 'full' | 'technical' | 'minimal'

export type SalesKpis = {
  orderCount: number
  revenue: number
  avgTicket: number
}

export type ConversionKpis = {
  uniqueVisitors: number
  completedOrders: number
  rate: number | null
}

export type RealtimeKpis = {
  activeVisitors: number
  activeCarts: number
}

export type RecentOrderRow = {
  id: number
  orderNumber: string | null
  total: number | null
  createdAt: string
  origin: string | null
  jeyjoStatus: string | null
  customerLabel: string
  adminUrl: string
}

export type EvaUnresolvedItem = {
  id: string
  label: string
  adminUrl?: string
}

export type EvaPanel = {
  activeConversations: number
  unresolvedQueries: EvaUnresolvedItem[]
  isLive: boolean
}

export type SystemAlertSeverity = 'error' | 'warning' | 'info'

export type SystemAlert = {
  id: string
  severity: SystemAlertSeverity
  title: string
  description: string
  timestamp: string | null
  href: string | null
}

export type DashboardSummary = {
  period: { from: string; to: string; label: string }
  sales: SalesKpis
  conversion: ConversionKpis
  realtime: RealtimeKpis
  recentOrders: RecentOrderRow[]
  eva: EvaPanel
  alerts: SystemAlert[]
  roleScope: DashboardRoleScope
}

export type DashboardStaffUser = {
  staffRoles?: StaffRole[] | null
}
