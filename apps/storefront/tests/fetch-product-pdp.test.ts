import { describe, expect, it, vi } from 'vitest'

import { isPublicCatalogProduct } from '@/lib/catalog/public-product-filter'
import { mapPdpDocToView, mapRelatedDocsToRows } from '@/lib/catalog/fetch-product-pdp'
import type { CmsPdpProductDoc } from '@/lib/catalog/fetch-product-pdp'

describe('PDP catalog visibility', () => {
  it('wildcard product is not public', () => {
    expect(
      isPublicCatalogProduct({
        skuErp: '9000000001',
        isWildcard: true,
        _status: 'published',
      }),
    ).toBe(false)
  })
})

describe('mapRelatedDocsToRows', () => {
  it('excludes draft and wildcard related products', () => {
    const related = [
      {
        skuErp: 'OK-1',
        slug: 'ok-1',
        title: 'Public',
        _status: 'published',
        isWildcard: false,
        supplier: { name: 'Marca' },
      },
      {
        skuErp: '9000000001',
        slug: 'wild',
        title: 'Wildcard',
        _status: 'published',
        isWildcard: true,
        supplier: { name: 'Marca' },
      },
      {
        skuErp: 'DRAFT-1',
        slug: 'draft-1',
        title: 'Draft',
        _status: 'draft',
        isWildcard: false,
        supplier: { name: 'Marca' },
      },
    ] as CmsPdpProductDoc[]

    const rows = mapRelatedDocsToRows(related)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.sku).toBe('OK-1')
  })
})

describe('mapPdpDocToView galleryUrls', () => {
  it('maps primary plus additional images with absolute URLs', () => {
    vi.stubEnv('CMS_URL', 'http://cms.test')
    const doc = {
      skuErp: 'REF-1',
      slug: 'ref-1',
      title: 'Producto',
      _status: 'published',
      isWildcard: false,
      supplier: { name: 'Marca' },
      ownImage: { url: '/media/own.jpg' },
      providerImageUrl: 'https://provider.example/p.jpg',
      additionalImages: [
        { image: { url: '/media/extra-1.jpg' } },
        { image: { url: '/media/extra-2.jpg' } },
      ],
    } as CmsPdpProductDoc

    const view = mapPdpDocToView(doc)
    expect(view?.galleryUrls).toEqual([
      'http://cms.test/media/own.jpg',
      'http://cms.test/media/extra-1.jpg',
      'http://cms.test/media/extra-2.jpg',
    ])
  })
})
