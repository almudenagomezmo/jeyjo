import { DEFAULT_SYSTEM_CONFIG } from '@/lib/system-config/defaults'
import type { SystemConfigDto, SystemSettingsDoc } from '@/lib/system-config/types'

function positiveNumber(value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

function positiveInt(value: unknown, fallback: number, min = 1): number {
  const n = Math.floor(Number(value))
  return Number.isFinite(n) && n >= min ? n : fallback
}

function optionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function mapSystemSettingsToDto(
  doc: SystemSettingsDoc | null | undefined,
  updatedAt?: string,
): SystemConfigDto {
  const base = DEFAULT_SYSTEM_CONFIG
  if (!doc) {
    return {
      ...base,
      updatedAt: updatedAt ?? base.updatedAt,
    }
  }

  return {
    shipping: {
      b2c: {
        threshold: positiveNumber(doc.shippingB2cThreshold, base.shipping.b2c.threshold),
        cost: positiveNumber(doc.shippingB2cCost, base.shipping.b2c.cost),
      },
      b2b: {
        threshold: positiveNumber(doc.shippingB2bThreshold, base.shipping.b2b.threshold),
        cost: positiveNumber(doc.shippingB2bCost, base.shipping.b2b.cost),
      },
    },
    stock: {
      lowThreshold: positiveInt(doc.stockLowThreshold, base.stock.lowThreshold, 0),
    },
    dashboard: {
      topSalesWindowDays: positiveInt(doc.topSalesWindowDays, base.dashboard.topSalesWindowDays),
      lowStockThreshold: positiveInt(
        doc.dashboardLowStockThreshold,
        base.dashboard.lowStockThreshold,
        0,
      ),
    },
    erp: {
      catalogStalenessHours: positiveInt(
        doc.catalogStalenessHours,
        base.erp.catalogStalenessHours,
      ),
    },
    contact: {
      supportPhone: optionalString(doc.supportPhone),
      supportEmail: optionalString(doc.supportEmail),
      whatsapp: optionalString(doc.whatsapp),
      stores: {
        alfaro: {
          name: optionalString(doc.storeAlfaroName) ?? base.contact.stores.alfaro.name,
          address: optionalString(doc.storeAlfaroAddress),
        },
        rincon: {
          name: optionalString(doc.storeRinconName) ?? base.contact.stores.rincon.name,
          address: optionalString(doc.storeRinconAddress),
        },
      },
    },
    search: {
      predictiveEnabled: doc.predictiveSearchEnabled !== false,
      suggestLimit: positiveInt(doc.suggestLimit, base.search.suggestLimit, 1),
      minQueryLength: positiveInt(doc.minQueryLength, base.search.minQueryLength, 1),
    },
    updatedAt: updatedAt ?? doc.updatedAt ?? new Date().toISOString(),
  }
}
