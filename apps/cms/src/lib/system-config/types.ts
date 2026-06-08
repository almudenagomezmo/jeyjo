export type StoreAddress = {
  name: string
  address: string | null
}

export type SystemConfigDto = {
  shipping: {
    b2c: { threshold: number; cost: number }
    b2b: { threshold: number; cost: number }
  }
  stock: { lowThreshold: number }
  dashboard: { topSalesWindowDays: number; lowStockThreshold: number }
  erp: { catalogStalenessHours: number }
  contact: {
    supportPhone: string | null
    supportEmail: string | null
    whatsapp: string | null
    stores: {
      alfaro: StoreAddress
      rincon: StoreAddress
    }
  }
  search: {
    predictiveEnabled: boolean
    suggestLimit: number
    minQueryLength: number
  }
  webNativeMode: boolean
  updatedAt: string
}

export type SystemSettingsDoc = {
  shippingB2cThreshold?: number | null
  shippingB2cCost?: number | null
  shippingB2bThreshold?: number | null
  shippingB2bCost?: number | null
  stockLowThreshold?: number | null
  topSalesWindowDays?: number | null
  dashboardLowStockThreshold?: number | null
  catalogStalenessHours?: number | null
  supportPhone?: string | null
  supportEmail?: string | null
  whatsapp?: string | null
  storeAlfaroName?: string | null
  storeAlfaroAddress?: string | null
  storeRinconName?: string | null
  storeRinconAddress?: string | null
  predictiveSearchEnabled?: boolean | null
  suggestLimit?: number | null
  minQueryLength?: number | null
  webNativeMode?: boolean | null
  updatedAt?: string | null
}

export type OperationalThresholds = {
  stockLowThreshold: number
  topSalesWindowDays: number
  dashboardLowStockThreshold: number
  catalogStalenessHours: number
}
