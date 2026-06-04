import { describe, it, expect } from 'vitest'

import {
  CA_PRECIOS_FIXTURES,
  createInMemoryPricingRepository,
  resolvePrice,
} from '../src/index.js'

const repo = createInMemoryPricingRepository(CA_PRECIOS_FIXTURES)
const b2bCustomer1 = CA_PRECIOS_FIXTURES.customers[0]!.customerId
const b2bCustomer2 = CA_PRECIOS_FIXTURES.customers[1]!.customerId

describe('CA-PRECIOS-001: P1 for anonymous', () => {
  it('returns p1_retail with gross 1.21 for REF-001', async () => {
    const quote = await resolvePrice({ sku: 'REF-001' }, repo)
    expect(quote.appliedRule).toBe('p1_retail')
    expect(quote.netUnit).toBe(1)
    expect(quote.grossUnit).toBe(1.21)
  })
})

describe('CA-PRECIOS-002: B2B P2 minus discount', () => {
  it('returns 9.00 net for REF-002 with 10% discount', async () => {
    const quote = await resolvePrice({ sku: 'REF-002', customerId: b2bCustomer1 }, repo)
    expect(quote.appliedRule).toBe('b2b_discount')
    expect(quote.netUnit).toBe(9)
    expect(quote.listUnit).toBe(10)
  })
})

describe('CA-PRECIOS-003: no stacking offer + B2B discount', () => {
  it('returns 8.00 not 7.20 for REF-003', async () => {
    const quote = await resolvePrice({ sku: 'REF-003', customerId: b2bCustomer1 }, repo)
    expect(quote.appliedRule).toBe('group_offer')
    expect(quote.netUnit).toBe(8)
    expect(quote.netUnit).not.toBe(7.2)
  })
})

describe('CA-PRECIOS-004: special price prevails', () => {
  it('returns 5.00 for REF-004 on empresa2 customer', async () => {
    const quote = await resolvePrice({ sku: 'REF-004', customerId: b2bCustomer2 }, repo)
    expect(quote.appliedRule).toBe('special_price')
    expect(quote.netUnit).toBe(5)
  })
})

describe('non-accumulation', () => {
  it('skips b2b discount when group offer matches', async () => {
    const quote = await resolvePrice({ sku: 'REF-003', customerId: b2bCustomer1 }, repo)
    expect(quote.appliedRule).toBe('group_offer')
  })
})
