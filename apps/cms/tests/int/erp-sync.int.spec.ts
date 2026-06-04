import type { Payload, PayloadRequest } from 'payload'
import { describe, it, expect, vi } from 'vitest'

import { ErpCatalogSyncService } from '@/erp/ErpCatalogSyncService'
import { createStubCatalogReader, STUB_SAMPLE_PRODUCTS } from '@jeyjo/erp-ports'

describe('ERP catalog sync (stub DTO → Payload fields)', () => {
  it('applies ERP fields and syncErpAt for existing product by skuErp', async () => {
    const sku = 'ERP-GRF-001'
    const dto = {
      ...STUB_SAMPLE_PRODUCTS.find((p) => p.skuErp === sku)!,
      mainWholesaleRef: 'DS-UPDATED-999',
      erpStock: 42,
    }

    const update = vi.fn().mockResolvedValue({ id: 10 })
    const find = vi.fn().mockResolvedValue({
      docs: [{ id: 10, skuErp: sku }],
    })

    const payload = { find, update } as unknown as Payload
    const service = new ErpCatalogSyncService(payload, createStubCatalogReader())

    const syncReq = { context: {} } as PayloadRequest
    const applied = await service.applyProduct(dto, syncReq)
    expect(applied).toBe(true)

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'products',
        id: 10,
        overrideAccess: true,
        data: expect.objectContaining({
          skuErp: sku,
          mainWholesaleRef: 'DS-UPDATED-999',
          erpStock: 42,
          syncErpAt: expect.any(String),
        }),
        req: expect.objectContaining({
          context: expect.objectContaining({ erpSync: true }),
        }) as PayloadRequest,
      }),
    )
  })
})
