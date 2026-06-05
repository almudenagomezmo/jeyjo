import { describe, expect, it, afterEach } from 'vitest'

import { mapSystemSettingsToDto } from '@/lib/system-config/map-dto'
import { resolveOperationalThresholds } from '@/lib/system-config/resolve'

describe('mapSystemSettingsToDto', () => {
  it('maps CMS shipping values', () => {
    const dto = mapSystemSettingsToDto({
      shippingB2cThreshold: 45,
      shippingB2cCost: 6,
      shippingB2bThreshold: 12,
      shippingB2bCost: 3,
    })
    expect(dto.shipping.b2c.threshold).toBe(45)
    expect(dto.shipping.b2c.cost).toBe(6)
    expect(dto.shipping.b2b.threshold).toBe(12)
    expect(dto.shipping.b2b.cost).toBe(3)
  })

  it('falls back to defaults for invalid numbers', () => {
    const dto = mapSystemSettingsToDto({
      shippingB2cThreshold: -1,
      stockLowThreshold: Number.NaN,
    })
    expect(dto.shipping.b2c.threshold).toBe(39)
    expect(dto.stock.lowThreshold).toBe(5)
  })
})

describe('resolveOperationalThresholds', () => {
  const prevStock = process.env.STOCK_LOW_THRESHOLD
  const prevDashboard = process.env.DASHBOARD_LOW_STOCK_THRESHOLD

  afterEach(() => {
    if (prevStock === undefined) delete process.env.STOCK_LOW_THRESHOLD
    else process.env.STOCK_LOW_THRESHOLD = prevStock
    if (prevDashboard === undefined) delete process.env.DASHBOARD_LOW_STOCK_THRESHOLD
    else process.env.DASHBOARD_LOW_STOCK_THRESHOLD = prevDashboard
  })

  it('uses CMS values when doc is present', () => {
    const thresholds = resolveOperationalThresholds({
      stockLowThreshold: 8,
      topSalesWindowDays: 14,
      dashboardLowStockThreshold: 10,
      catalogStalenessHours: 12,
    })
    expect(thresholds.stockLowThreshold).toBe(8)
    expect(thresholds.topSalesWindowDays).toBe(14)
    expect(thresholds.dashboardLowStockThreshold).toBe(10)
  })

  it('uses env fallback when doc is missing', () => {
    process.env.STOCK_LOW_THRESHOLD = '10'
    process.env.DASHBOARD_LOW_STOCK_THRESHOLD = '7'
    const thresholds = resolveOperationalThresholds(null)
    expect(thresholds.stockLowThreshold).toBe(10)
    expect(thresholds.dashboardLowStockThreshold).toBe(7)
  })
})
