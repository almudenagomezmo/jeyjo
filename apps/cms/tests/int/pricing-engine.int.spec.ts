import { describe, it, expect } from 'vitest'

import { CA_PRECIOS_FIXTURES, createInMemoryPricingRepository, resolvePrice } from '@jeyjo/pricing'

describe('pricing engine CA-PRECIOS-002 (in-memory)', () => {
  const repo = createInMemoryPricingRepository(CA_PRECIOS_FIXTURES)
  const b2bCustomer = CA_PRECIOS_FIXTURES.customers[0]!.customerId

  it('resolves REF-002 to 9.00 net for B2B fixture customer', async () => {
    const quote = await resolvePrice({ sku: 'REF-002', customerId: b2bCustomer }, repo)
    expect(quote.netUnit).toBe(9)
    expect(quote.appliedRule).toBe('b2b_discount')
  })
})
