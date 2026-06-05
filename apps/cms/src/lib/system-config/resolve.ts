import type { Payload } from 'payload'

import { DEFAULT_SYSTEM_CONFIG } from '@/lib/system-config/defaults'
import { mapSystemSettingsToDto } from '@/lib/system-config/map-dto'
import type {
  OperationalThresholds,
  SystemConfigDto,
  SystemSettingsDoc,
} from '@/lib/system-config/types'

function envInt(name: string, fallback: number, min = 0): number {
  const raw = Number(process.env[name])
  return Number.isFinite(raw) && raw >= min ? raw : fallback
}

function applyEnvFallbacks(config: SystemConfigDto): SystemConfigDto {
  return {
    ...config,
    stock: {
      lowThreshold: envInt('STOCK_LOW_THRESHOLD', config.stock.lowThreshold),
    },
    dashboard: {
      topSalesWindowDays: envInt('TOP_SALES_WINDOW_DAYS', config.dashboard.topSalesWindowDays, 1),
      lowStockThreshold: envInt(
        'DASHBOARD_LOW_STOCK_THRESHOLD',
        config.dashboard.lowStockThreshold,
      ),
    },
    erp: {
      catalogStalenessHours: envInt(
        'CATALOG_STALENESS_HOURS',
        config.erp.catalogStalenessHours,
        1,
      ),
    },
  }
}

export async function loadSystemSettingsDoc(
  payload: Payload,
): Promise<SystemSettingsDoc | null> {
  try {
    const global = await payload.findGlobal({
      slug: 'systemSettings',
      overrideAccess: true,
    })
    return global as SystemSettingsDoc
  } catch {
    return null
  }
}

export async function getSystemConfig(payload?: Payload): Promise<SystemConfigDto> {
  if (!payload) {
    return applyEnvFallbacks(DEFAULT_SYSTEM_CONFIG)
  }

  const doc = await loadSystemSettingsDoc(payload)
  if (!doc) {
    return applyEnvFallbacks(mapSystemSettingsToDto(null))
  }

  return mapSystemSettingsToDto(doc, doc.updatedAt ?? undefined)
}

export function resolveOperationalThresholds(
  doc?: SystemSettingsDoc | null,
): OperationalThresholds {
  const dto = doc ? mapSystemSettingsToDto(doc) : applyEnvFallbacks(mapSystemSettingsToDto(null))
  return {
    stockLowThreshold: dto.stock.lowThreshold,
    topSalesWindowDays: dto.dashboard.topSalesWindowDays,
    dashboardLowStockThreshold: dto.dashboard.lowStockThreshold,
    catalogStalenessHours: dto.erp.catalogStalenessHours,
  }
}

export function buildShippingPolicyText(config: SystemConfigDto): string {
  const { b2c, b2b } = config.shipping
  return `B2C: envío gratis desde ${b2c.threshold}€ (coste ${b2c.cost}€ IVA incl. por debajo). B2B: envío gratis desde ${b2b.threshold}€ (gastos de gestión ${b2b.cost}€ por debajo). Envío en 24-48 h laborables en península.`
}
