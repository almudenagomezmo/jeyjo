import type { ErpPurchaseHistoryLineDto } from '../../types/purchase-history-dtos.js'

/**
 * Avansuite API fields expected for production adapter (#36):
 * - customerErpCode (CIF / código cliente ERP)
 * - line.skuErp, line.quantity, line.purchasedAt (ISO date), line.netUnitPrice (histórico)
 * - optional line.department / site code
 */
export const STUB_PURCHASE_HISTORY: Record<string, ErpPurchaseHistoryLineDto[]> = {
  'B2B-EMPRESA1': [
    {
      sku: 'REF-010',
      quantity: 12,
      purchasedAt: '2026-01-15',
      historicalUnitPrice: 5,
      department: 'Sede central',
    },
    {
      sku: 'REF-002',
      quantity: 6,
      purchasedAt: '2025-11-20',
      historicalUnitPrice: 10,
      department: 'Sede central',
    },
    {
      sku: 'REF-001',
      quantity: 24,
      purchasedAt: '2026-03-01',
      historicalUnitPrice: 0.9,
    },
    {
      sku: '9000000001',
      quantity: 1,
      purchasedAt: '2026-02-01',
      historicalUnitPrice: 0,
    },
  ],
  'B2B-EMPRESA2': [
    {
      sku: 'REF-004',
      quantity: 4,
      purchasedAt: '2026-04-10',
      historicalUnitPrice: 8,
    },
  ],
}
