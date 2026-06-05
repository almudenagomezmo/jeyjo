import { describe, expect, it } from 'vitest'

import { resolveDashboardPeriod } from '@/lib/dashboard/period'

describe('dashboard period resolver', () => {
  const fixedNow = new Date('2026-06-05T12:00:00.000Z')

  it('resolves today preset', () => {
    const period = resolveDashboardPeriod({ period: 'today', now: fixedNow })
    expect(period.preset).toBe('today')
    expect(period.label).toBe('Hoy')
    expect(period.from.getTime()).toBeLessThanOrEqual(period.to.getTime())
  })

  it('resolves custom inclusive range', () => {
    const period = resolveDashboardPeriod({
      period: 'custom',
      from: '2026-06-01',
      to: '2026-06-03',
      now: fixedNow,
    })
    expect(period.preset).toBe('custom')
    expect(period.from.getTime()).toBeLessThanOrEqual(period.to.getTime())
  })

  it('resolves week preset with Monday start', () => {
    const period = resolveDashboardPeriod({ period: 'week', now: fixedNow })
    expect(period.preset).toBe('week')
    expect(period.label).toBe('Esta semana')
  })
})
