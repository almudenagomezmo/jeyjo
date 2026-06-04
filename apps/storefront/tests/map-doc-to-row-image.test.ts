import { describe, expect, it } from 'vitest'

import { mapDocToRow, type CmsProductListDoc } from '@/lib/catalog/fetch-product-list'

describe('mapDocToRow imageUrl', () => {
  it('returns absolute catalog URL when ownImage is populated', () => {
    const row = mapDocToRow({
      skuErp: 'REF-1',
      slug: 'ref-1',
      title: 'Producto',
      stockIndicator: 'available',
      ownImage: { url: '/media/own.jpg' },
      providerImageUrl: 'https://provider.example/p.jpg',
    } as CmsProductListDoc)

    expect(row?.imageUrl).toBe('/media/own.jpg')
  })

  it('falls back to provider URL when own image is empty', () => {
    const row = mapDocToRow({
      skuErp: 'REF-2',
      slug: 'ref-2',
      title: 'Producto',
      stockIndicator: 'available',
      ownImage: null,
      providerImageUrl: 'https://provider.example/p.jpg',
    } as CmsProductListDoc)

    expect(row?.imageUrl).toBe('https://provider.example/p.jpg')
  })
})
