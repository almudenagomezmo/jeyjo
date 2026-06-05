import { describe, it, expect, beforeEach } from 'vitest'

import {
  ErpIntegrationError,
  createStubCatalogReader,
  createStubCatalogWriter,
  createStubDocumentsReader,
  resetStubAdapterState,
  setStubSimulateUnavailable,
} from '../src/index.js'

describe('stub ErpCatalogReader', () => {
  beforeEach(() => {
    resetStubAdapterState()
    setStubSimulateUnavailable(false)
  })

  it('lists at least two products with distinct skuErp and prices', async () => {
    const reader = createStubCatalogReader()
    const page = await reader.listProducts()
    expect(page.items.length).toBeGreaterThanOrEqual(2)
    const skus = new Set(page.items.map((p) => p.skuErp))
    expect(skus.size).toBeGreaterThanOrEqual(2)
    for (const p of page.items) {
      expect(p.p1Price).toBeTypeOf('number')
      expect(p.p2Price).toBeTypeOf('number')
    }
  })

  it('returns null for unknown SKU', async () => {
    const reader = createStubCatalogReader()
    await expect(reader.getProductBySku('UNKNOWN-SKU')).resolves.toBeNull()
  })

  it('includes CA-PRECIOS fixture REF-003 and wildcard SKU', async () => {
    const reader = createStubCatalogReader()
    const ref3 = await reader.getProductBySku('REF-003')
    expect(ref3?.p1Price).toBe(12)
    expect(ref3?.p2Price).toBe(10)

    const wildcard = await reader.getProductBySku('9000000001')
    expect(wildcard?.isWildcard).toBe(true)

    const page = await reader.listProducts({ limit: 100 })
    expect(page.items.some((p) => p.skuErp === 'REF-004')).toBe(true)
  })

  it('simulates ERP_UNAVAILABLE without corrupting store', async () => {
    const reader = createStubCatalogReader()
    setStubSimulateUnavailable(true)
    await expect(reader.listProducts()).rejects.toMatchObject({
      code: 'ERP_UNAVAILABLE',
    })
    setStubSimulateUnavailable(false)
    const page = await reader.listProducts()
    expect(page.items.length).toBeGreaterThanOrEqual(2)
  })
})

describe('stub ErpCatalogWriter', () => {
  beforeEach(() => {
    resetStubAdapterState()
    setStubSimulateUnavailable(false)
  })

  it('upserts product idempotently by skuErp', async () => {
    const reader = createStubCatalogReader()
    const writer = createStubCatalogWriter()
    const sku = 'ERP-GRF-001'

    await writer.upsertProduct({
      skuErp: sku,
      p1Price: 10,
      p2Price: 9,
    })
    await writer.upsertProduct({
      skuErp: sku,
      p1Price: 10,
      p2Price: 77.7,
    })

    const product = await reader.getProductBySku(sku)
    expect(product?.p2Price).toBe(77.7)
    const all = await reader.listProducts()
    const matches = all.items.filter((p) => p.skuErp === sku)
    expect(matches).toHaveLength(1)
  })

  it('rejects product without skuErp', async () => {
    const writer = createStubCatalogWriter()
    await expect(
      writer.upsertProduct({ skuErp: '  ', p1Price: 1 }),
    ).rejects.toBeInstanceOf(ErpIntegrationError)
    await expect(writer.upsertProduct({ skuErp: '' })).rejects.toMatchObject({
      code: 'ERP_VALIDATION',
    })
  })
})

describe('stub ErpDocumentsReader', () => {
  it('lists invoices by customer for B2B-EMPRESA1', async () => {
    const docs = createStubDocumentsReader()
    const rows = await docs.listInvoicesByCustomer('B2B-EMPRESA1')
    expect(rows.length).toBeGreaterThanOrEqual(2)
    expect(rows[0]).toMatchObject({
      currency: 'EUR',
      customerErpCode: 'B2B-EMPRESA1',
    })
  })

  it('throws ERP_NOT_IMPLEMENTED for delivery notes', async () => {
    const docs = createStubDocumentsReader()
    await expect(docs.listDeliveryNotes()).rejects.toMatchObject({
      code: 'ERP_NOT_IMPLEMENTED',
    })
  })
})
