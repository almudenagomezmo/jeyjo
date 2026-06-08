import { DEFAULT_FOOTER_CONFIG } from '@/lib/footer/defaults'
import type { SystemConfigDto } from '@/lib/system-config/types'

export type { SystemConfigDto, StoreAddress } from '@/lib/system-config/types'

export type ShippingRules = SystemConfigDto['shipping']

export const DEFAULT_SHIPPING_RULES: ShippingRules = {
  b2c: { threshold: 39, cost: 5 },
  b2b: { threshold: 10, cost: 2.5 },
}

export const DEFAULT_SYSTEM_CONFIG: SystemConfigDto = {
  shipping: DEFAULT_SHIPPING_RULES,
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
  webNativeMode: true,
  footer: DEFAULT_FOOTER_CONFIG,
  updatedAt: new Date(0).toISOString(),
}
