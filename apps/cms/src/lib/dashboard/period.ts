import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns'

import type { DashboardPeriodPreset, ResolvedPeriod } from '@/lib/dashboard/types'

const DASHBOARD_TZ = process.env.TZ || 'Europe/Madrid'

const PRESET_LABELS: Record<Exclude<DashboardPeriodPreset, 'custom'>, string> = {
  today: 'Hoy',
  yesterday: 'Ayer',
  week: 'Esta semana',
  month: 'Este mes',
}

/** Current instant interpreted in dashboard timezone (Madrid by default). */
export function nowInDashboardTz(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: DASHBOARD_TZ }))
}

function parseCustomDate(value: string | undefined): Date | null {
  if (!value?.trim()) return null
  const parsed = new Date(value.trim())
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function resolveDashboardPeriod(input: {
  period?: string | null
  from?: string | null
  to?: string | null
  now?: Date
}): ResolvedPeriod {
  const preset = (input.period?.trim() || 'today') as DashboardPeriodPreset
  const now = input.now ?? nowInDashboardTz()

  if (preset === 'custom') {
    const fromRaw = parseCustomDate(input.from ?? undefined)
    const toRaw = parseCustomDate(input.to ?? undefined)
    if (!fromRaw || !toRaw) {
      const fallbackFrom = startOfDay(now)
      const fallbackTo = endOfDay(now)
      return {
        preset: 'custom',
        from: fallbackFrom,
        to: fallbackTo,
        label: 'Personalizado',
      }
    }
    const from = startOfDay(fromRaw)
    const to = endOfDay(toRaw < fromRaw ? fromRaw : toRaw)
    return {
      preset: 'custom',
      from,
      to,
      label: 'Personalizado',
    }
  }

  if (preset === 'yesterday') {
    const day = subDays(now, 1)
    return {
      preset,
      from: startOfDay(day),
      to: endOfDay(day),
      label: PRESET_LABELS.yesterday,
    }
  }

  if (preset === 'week') {
    return {
      preset,
      from: startOfWeek(now, { weekStartsOn: 1 }),
      to: endOfWeek(now, { weekStartsOn: 1 }),
      label: PRESET_LABELS.week,
    }
  }

  if (preset === 'month') {
    return {
      preset,
      from: startOfMonth(now),
      to: endOfMonth(now),
      label: PRESET_LABELS.month,
    }
  }

  return {
    preset: 'today',
    from: startOfDay(now),
    to: endOfDay(now),
    label: PRESET_LABELS.today,
  }
}

export function periodToIsoRange(period: ResolvedPeriod): { from: string; to: string } {
  return {
    from: period.from.toISOString(),
    to: period.to.toISOString(),
  }
}
