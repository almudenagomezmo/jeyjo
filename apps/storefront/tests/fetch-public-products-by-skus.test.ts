import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchPublicProductsBySkus } from '@/lib/catalog/fetch-public-products-by-skus'

describe('fetchPublicProductsBySkus', () => {
  beforeEach(() => {
    vi.stubEnv('CMS_URL', 'http://cms.test')
  })

  it('preserves order and excludes wildcard and draft', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        docs: [
          {
            skuErp: 'REF-002',
            title: 'Second',
            slug: 'ref-002',
            _status: 'published',
            isWildcard: false,
          },
          {
            skuErp: 'REF-001',
            title: 'First',
            slug: 'ref-001',
            _status: 'published',
            isWildcard: false,
          },
          {
            skuErp: 'WILD',
            title: 'Wildcard',
            slug: 'wild',
            _status: 'published',
            isWildcard: true,
          },
          {
            skuErp: 'DRAFT',
            title: 'Draft',
            slug: 'draft',
            _status: 'draft',
            isWildcard: false,
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const docs = await fetchPublicProductsBySkus(['REF-001', 'WILD', 'REF-002', 'DRAFT'])

    expect(docs.map((d) => d.skuErp)).toEqual(['REF-001', 'REF-002'])
  })

  it('sets thumbnailUrl from ownImage via resolveCatalogImage', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          docs: [
            {
              skuErp: 'REF-IMG',
              title: 'With image',
              slug: 'ref-img',
              _status: 'published',
              isWildcard: false,
              ownImage: { url: '/media/own.jpg' },
              providerImageUrl: 'https://provider.example/p.jpg',
            },
          ],
        }),
      }),
    )

    const docs = await fetchPublicProductsBySkus(['REF-IMG'])
    expect(docs[0]?.thumbnailUrl).toBe('http://cms.test/media/own.jpg')
  })
})
