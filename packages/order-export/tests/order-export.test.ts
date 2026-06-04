import { describe, it, expect } from 'vitest'

import {
  AVANSUITE_COLUMN_HEADERS,
  buildAvansuiteOrderRows,
  serializeAvansuiteXlsx,
  validateAvansuiteOrder,
  validateAvansuiteOrders,
} from '../src/index.js'

const sampleOrder = {
  orderNumber: 'JW-TEST001',
  createdAt: '2026-06-04T10:00:00.000Z',
  customerErpCode: 'CLI-100',
  customerTaxId: 'B12345678',
  lines: [
    { skuErp: 'REF-001', name: 'Bolígrafo', qty: 2, unitPrice: 1.5, lineTotal: 3 },
    { skuErp: 'REF-002', name: 'Cuaderno', qty: 1, unitPrice: 4.2, lineTotal: 4.2 },
  ],
}

describe('buildAvansuiteOrderRows', () => {
  it('maps one row per line', () => {
    const rows = buildAvansuiteOrderRows(sampleOrder)
    expect(rows).toHaveLength(2)
    expect(rows[0]?.webOrderNumber).toBe('JW-TEST001')
    expect(rows[0]?.skuErp).toBe('REF-001')
    expect(rows[0]?.quantity).toBe(2)
    expect(rows[0]?.customerErpCode).toBe('CLI-100')
  })
})

describe('validateAvansuiteOrders', () => {
  it('passes valid order', () => {
    expect(validateAvansuiteOrders([sampleOrder]).ok).toBe(true)
  })

  it('fails without customer identifier', () => {
    const result = validateAvansuiteOrders([
      { ...sampleOrder, customerErpCode: null, customerTaxId: null },
    ])
    expect(result.ok).toBe(false)
    expect(result.issues[0]?.field).toBe('customer')
  })

  it('fails on empty lines', () => {
    expect(validateAvansuiteOrder({ ...sampleOrder, lines: [] }).length).toBeGreaterThan(0)
  })
})

describe('serializeAvansuiteXlsx', () => {
  it('produces non-empty xlsx buffer', async () => {
    const buf = await serializeAvansuiteXlsx([sampleOrder])
    expect(buf.length).toBeGreaterThan(1000)
    expect(buf[0]).toBe(0x50) // PK zip header
  })
})

describe('AVANSUITE_COLUMN_HEADERS', () => {
  it('matches documented column count', () => {
    expect(AVANSUITE_COLUMN_HEADERS).toHaveLength(8)
  })
})
