import type { SystemConfigDto } from '@/lib/system-config/types'

export const DEFAULT_SHIPPING = {
  b2c: { threshold: 39, cost: 5 },
  b2b: { threshold: 10, cost: 2.5 },
} as const

export const DEFAULT_SYSTEM_CONFIG: SystemConfigDto = {
  shipping: {
    b2c: { ...DEFAULT_SHIPPING.b2c },
    b2b: { ...DEFAULT_SHIPPING.b2b },
  },
  stock: { lowThreshold: 5 },
  dashboard: { topSalesWindowDays: 30, lowStockThreshold: 5 },
  erp: { catalogStalenessHours: 24 },
  contact: {
    supportPhone: null,
    supportEmail: null,
    whatsapp: null,
    stores: {
      alfaro: { name: 'Alfaro', address: null },
      rincon: { name: 'Rincón de Soto', address: null },
    },
  },
  search: { predictiveEnabled: true, suggestLimit: 8, minQueryLength: 2 },
  updatedAt: new Date(0).toISOString(),
}

export const SYSTEM_SETTINGS_SEED = {
  shippingB2cThreshold: DEFAULT_SHIPPING.b2c.threshold,
  shippingB2cCost: DEFAULT_SHIPPING.b2c.cost,
  shippingB2bThreshold: DEFAULT_SHIPPING.b2b.threshold,
  shippingB2bCost: DEFAULT_SHIPPING.b2b.cost,
  stockLowThreshold: 5,
  topSalesWindowDays: 30,
  dashboardLowStockThreshold: 5,
  catalogStalenessHours: 24,
  supportPhone: '',
  supportEmail: '',
  whatsapp: '',
  storeAlfaroName: 'Alfaro',
  storeAlfaroAddress: '',
  storeRinconName: 'Rincón de Soto',
  storeRinconAddress: '',
  predictiveSearchEnabled: true,
  suggestLimit: 8,
  minQueryLength: 2,
}
