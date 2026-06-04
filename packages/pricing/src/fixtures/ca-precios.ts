import type { InMemoryPricingData } from '../in-memory-repository.js'

/** CA-PRECIOS-001..004 product and customer fixtures. */
export const CA_PRECIOS_FIXTURES: InMemoryPricingData = {
  products: [
    { sku: 'REF-001', p1Price: 1, p2Price: 0.9, vatRate: 21 },
    { sku: 'REF-002', p1Price: 12, p2Price: 10, vatRate: 21 },
    { sku: 'REF-003', p1Price: 12, p2Price: 10, vatRate: 21 },
    { sku: 'REF-004', p1Price: 10, p2Price: 8, vatRate: 21 },
  ],
  customers: [
    {
      customerId: 'a0000001-0001-4001-8001-000000000001',
      customerGroup: 2,
      generalDiscount: 10,
      erpCode: 'B2B-EMPRESA1',
    },
    {
      customerId: 'a0000001-0001-4001-8001-000000000002',
      customerGroup: 2,
      generalDiscount: 5,
      erpCode: 'B2B-EMPRESA2',
    },
  ],
  specialPrices: [
    {
      customerId: 'a0000001-0001-4001-8001-000000000002',
      sku: 'REF-004',
      netPrice: 5,
    },
  ],
  groupOffers: [{ sku: 'REF-003', offerNetPrice: 8 }],
}
