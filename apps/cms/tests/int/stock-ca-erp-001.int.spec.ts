import type { Payload, PayloadRequest } from 'payload'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { ErpCatalogSyncService } from '@/erp/ErpCatalogSyncService'
import { recalculateStockIndicatorsForSkus } from '@/stock/recalculateIndicators'
import { createStubCatalogReader, STUB_SAMPLE_PRODUCTS } from '@jeyjo/erp-ports'

describe('CA-ERP-001 partial: REF-002 low after ERP catalog sync', () => {
  beforeEach(() => {
    process.env.STOCK_LOW_THRESHOLD = '5'
  })

  it('recalculates indicator to low when ERP stock drops to 2', async () => {
    const dto = STUB_SAMPLE_PRODUCTS.find((p) => p.skuErp === 'REF-002')!
    expect(dto.erpStock).toBe(2)

    const update = vi.fn().mockResolvedValue({ id: 2 })
    const find = vi.fn().mockImplementation(({ collection, where }) => {
      if (collection === 'products' && where?.skuErp?.equals === 'REF-002') {
        return Promise.resolve({
          docs: [
            {
              id: 2,
              skuErp: 'REF-002',
              erpStock: 2,
              distrisantiagoStock: 100,
              arnoiaStock: 0,
            },
          ],
        })
      }
      return Promise.resolve({ docs: [] })
    })

    const payload = { find, update } as unknown as Payload
    const syncReq = { context: { erpSync: true } } as PayloadRequest

    const service = new ErpCatalogSyncService(payload, createStubCatalogReader())
    await service.applyProduct(dto, syncReq)

    const indicatorResult = await recalculateStockIndicatorsForSkus({
      payload,
      req: { context: { stockSync: true } } as PayloadRequest,
      skus: ['REF-002'],
    })

    expect(indicatorResult.productsUpdated).toBe(1)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { stockIndicator: 'low' },
      }),
    )
  })
})
