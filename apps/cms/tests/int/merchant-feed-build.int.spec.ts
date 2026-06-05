import { describe, expect, it } from 'vitest'

import {
  buildMerchantFeedXml,
  formatMerchantPrice,
  mapStockToMerchantAvailability,
} from '@/lib/feeds/merchant-center/build-xml'

describe('merchant feed builder', () => {
  it('builds RSS XML with Google namespace', () => {
    const xml = buildMerchantFeedXml([
      {
        id: 'REF-001',
        title: 'Bolígrafo',
        description: 'Bolígrafo azul',
        link: 'http://localhost:3000/p/boligrafo',
        imageLink: 'https://cdn.example.com/img.jpg',
        price: '2.42 EUR',
        availability: 'in_stock',
        brand: 'Pilot',
        gtin: '8412345678901',
      },
    ])

    expect(xml).toContain('xmlns:g="http://base.google.com/ns/1.0"')
    expect(xml).toContain('<g:id>REF-001</g:id>')
    expect(xml).toContain('<g:price>2.42 EUR</g:price>')
    expect(xml).toContain('<g:availability>in_stock</g:availability>')
    expect(xml).toContain('<g:brand>Pilot</g:brand>')
  })

  it('formats price with VAT', () => {
    expect(formatMerchantPrice(10, 21)).toBe('12.10 EUR')
  })

  it('maps stock indicator to GMC availability', () => {
    expect(mapStockToMerchantAvailability({ stockIndicator: 'available' })).toBe('in_stock')
    expect(mapStockToMerchantAvailability({ stockIndicator: 'low' })).toBe('in_stock')
    expect(
      mapStockToMerchantAvailability({
        stockIndicator: 'limited',
        allowOrderWithoutStock: true,
      }),
    ).toBe('preorder')
    expect(mapStockToMerchantAvailability({ stockIndicator: null })).toBe('out_of_stock')
  })
})
