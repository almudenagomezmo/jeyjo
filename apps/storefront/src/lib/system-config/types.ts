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
  updatedAt: string
}
