import { describe, it, expect, beforeEach } from 'vitest'

import {
  ErpIntegrationError,
  createStubCatalogReader,
  createStubCatalogWriter,
  createStubDocumentsReader,
  resetStubAdapterState,
  setStubSimulateUnavailable,
  STUB_INVOICES_BY_CUSTOMER,
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
  it('lists invoices by customer for B2B-EMPRESA1 with US-08 columns', async () => {
    const docs = createStubDocumentsReader()
    const rows = await docs.listInvoicesByCustomer('B2B-EMPRESA1')
    expect(rows.length).toBeGreaterThanOrEqual(3)
    expect(rows[0]).toMatchObject({
      currency: 'EUR',
      customerErpCode: 'B2B-EMPRESA1',
      status: 'updated',
    })
    expect(rows.every((r) => r.invoiceNumber && r.netAmount > 0 && r.grossAmount > 0)).toBe(true)
    expect(rows.some((r) => r.id === 'INV-2026-0001')).toBe(true)
  })

  it('excludes draft and invoices older than five years', async () => {
    const docs = createStubDocumentsReader()
    const rows = await docs.listInvoicesByCustomer('B2B-EMPRESA1')
    expect(rows.some((r) => r.id === 'INV-DRAFT-001')).toBe(false)
    expect(rows.some((r) => r.id === 'INV-2019-OLD')).toBe(false)
  })

  it('lists delivery notes by customer without ERP_NOT_IMPLEMENTED', async () => {
    const docs = createStubDocumentsReader()
    const rows = await docs.listDeliveryNotesByCustomer('B2B-EMPRESA1')
    expect(rows.length).toBeGreaterThanOrEqual(2)
    expect(rows.some((r) => r.status === 'issued')).toBe(true)
    expect(rows.some((r) => r.status === 'preparing')).toBe(true)
  })

  it('returns CA-B2B-003 due payments', async () => {
    const docs = createStubDocumentsReader()
    const rows = await docs.listDuePaymentsByCustomer('B2B-EMPRESA1')
    const overdue = rows.find((r) => r.invoiceNumber === 'FAC-2024-001')
    const pending = rows.find((r) => r.invoiceNumber === 'FAC-2026-050')
    expect(overdue?.isOverdue).toBe(true)
    expect(overdue?.outstandingAmount).toBe(150)
    expect(pending?.isOverdue).toBe(false)
    expect(pending?.outstandingAmount).toBe(300)
    const total = rows.reduce((sum, r) => sum + r.outstandingAmount, 0)
    expect(total).toBe(450)
  })

  it('does not leak invoices across customers', async () => {
    const docs = createStubDocumentsReader()
    const a = await docs.listInvoicesByCustomer('B2B-EMPRESA1')
    const b = await docs.listInvoicesByCustomer('B2B-EMPRESA2')
    const aIds = new Set(a.map((r) => r.id))
    for (const row of b) {
      expect(aIds.has(row.id)).toBe(false)
    }
  })

  it('returns stub PDF with %PDF- header', async () => {
    const docs = createStubDocumentsReader()
    const pdf = await docs.getDocumentPdf({
      type: 'invoice',
      documentId: 'INV-2026-0001',
      customerErpCode: 'B2B-EMPRESA1',
    })
    expect(pdf.contentType).toBe('application/pdf')
    expect(pdf.bytes.length).toBeGreaterThan(0)
    expect(String.fromCharCode(...pdf.bytes.slice(0, 5))).toBe('%PDF-')
  })

  it('rejects cross-customer PDF access', async () => {
    const docs = createStubDocumentsReader()
    await expect(
      docs.getDocumentPdf({
        type: 'invoice',
        documentId: 'INV-2026-0100',
        customerErpCode: 'B2B-EMPRESA1',
      }),
    ).rejects.toMatchObject({ code: 'ERP_VALIDATION' })
  })

  it('invoice sync fixture ids remain in stub map', () => {
    const rows = STUB_INVOICES_BY_CUSTOMER['B2B-EMPRESA1'] ?? []
    expect(rows.some((r) => r.id === 'INV-2026-0001' && r.totalAmount === 450.5)).toBe(true)
  })
})
