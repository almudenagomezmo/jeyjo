import type { Payload, PayloadRequest } from 'payload'
import { describe, it, expect, vi } from 'vitest'

import { ErpCatalogSyncService } from '@/erp/ErpCatalogSyncService'
import { createExcelCatalogReader } from '@jeyjo/erp-excel'
import type { ErpProductDto } from '@jeyjo/erp-ports'

function buildImportProducts(): ErpProductDto[] {
  const products: ErpProductDto[] = []
  for (let i = 1; i <= 50; i++) {
    const sku = i === 26 ? '9000000001' : `REF-IMP-${String(i).padStart(3, '0')}`
    products.push({
      skuErp: sku,
      shortDescription: `Producto ${i}`,
      p1Price: i === 1 ? 99.99 : 10 + i * 0.01,
      p2Price: 8 + i * 0.01,
      vatRate: 21,
      isWildcard: sku === '9000000001',
    })
  }
  return products
}

describe('Catalog Excel import (CA-BACKEND-002 partial)', () => {
  it('apply updates p1Price and marks wildcard from Excel DTOs', async () => {
    const products = buildImportProducts()

    expect(products.find((p) => p.skuErp === '9000000001')?.isWildcard).toBe(true)

    const update = vi.fn().mockResolvedValue({ id: 10 })
    const find = vi.fn().mockImplementation(async ({ collection, where }) => {
      if (collection === 'products' && where?.skuErp?.equals === 'REF-IMP-001') {
        return { docs: [{ id: 10, skuErp: 'REF-IMP-001' }] }
      }
      if (collection === 'products' && where?.skuErp?.equals === '9000000001') {
        return { docs: [{ id: 11, skuErp: '9000000001' }] }
      }
      return { docs: [] }
    })

    const payload = { find, update, create: vi.fn() } as unknown as Payload
    const reader = createExcelCatalogReader({ products, suppliers: [] })
    const service = new ErpCatalogSyncService(payload, reader)
    const syncReq = { context: {} } as PayloadRequest

    const wildcardApplied = await service.applyProduct(
      products.find((p) => p.skuErp === '9000000001')!,
      syncReq,
    )
    expect(wildcardApplied).toBe(true)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isWildcard: true }),
      }),
    )

    const target = products.find((p) => p.skuErp === 'REF-IMP-001')!
    const applied = await service.applyProduct(target, syncReq)
    expect(applied).toBe(true)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ p1Price: 99.99 }),
      }),
    )
  })
})
