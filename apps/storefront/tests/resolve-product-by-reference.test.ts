import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resolveProductByReference } from '@/lib/catalog/resolve-product-by-reference'

describe('resolveProductByReference', () => {
  beforeEach(() => {
    vi.stubEnv('CMS_URL', 'http://cms.test')
  })

  it('resolves by SKU first', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          docs: [
            {
              skuErp: 'REF-SKU',
              slug: 'ref-sku',
              title: 'By SKU',
              _status: 'published',
              isWildcard: false,
            },
          ],
        }),
      })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveProductByReference('REF-SKU')
    expect(result?.matchedField).toBe('sku')
    expect(result?.sku).toBe('REF-SKU')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('falls back to OEM then EAN', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ docs: [] }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          docs: [
            {
              skuErp: 'REF-OEM',
              oemRef: 'OEM-99',
              slug: 'ref-oem',
              title: 'By OEM',
              _status: 'published',
              isWildcard: false,
            },
          ],
        }),
      })
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveProductByReference('OEM-99')
    expect(result?.matchedField).toBe('oem')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('excludes wildcard and draft', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        docs: [
          {
            skuErp: 'WILD',
            slug: 'wild',
            _status: 'published',
            isWildcard: true,
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    expect(await resolveProductByReference('WILD')).toBeNull()

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        docs: [{ skuErp: 'DRAFT', slug: 'draft', _status: 'draft', isWildcard: false }],
      }),
    })
    expect(await resolveProductByReference('DRAFT')).toBeNull()
  })

  it('returns null for unknown reference', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ docs: [] }) })
    vi.stubGlobal('fetch', fetchMock)

    expect(await resolveProductByReference('UNKNOWN-XYZ')).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
