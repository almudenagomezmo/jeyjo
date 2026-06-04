import { describe, expect, it, vi, beforeEach } from 'vitest'

import { listPublicProductsByIds } from '@/lib/catalog/fetch-product-list'

describe('listPublicProductsByIds', () => {
  beforeEach(() => {
    vi.stubEnv('CMS_URL', 'http://cms.test')
  })

  it('preserves order and excludes draft and wildcard', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        docs: [
          {
            id: '2',
            skuErp: 'REF-002',
            title: 'Second',
            slug: 'ref-002',
            _status: 'published',
            isWildcard: false,
          },
          {
            id: '1',
            skuErp: 'REF-001',
            title: 'First',
            slug: 'ref-001',
            _status: 'published',
            isWildcard: false,
          },
          {
            id: '3',
            skuErp: 'WILD',
            title: 'Wildcard',
            slug: 'wild',
            _status: 'published',
            isWildcard: true,
          },
          {
            id: '4',
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

    const rows = await listPublicProductsByIds(['1', '2', '3', '4', 'missing'])

    expect(rows.map((r) => r.sku)).toEqual(['REF-001', 'REF-002'])
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})
