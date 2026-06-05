import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resolveProductByReference } from '@/lib/intranet/quick-order/resolve-reference'

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  process.env.CMS_URL = 'http://cms.test'
})

describe('resolveProductByReference', () => {
  it('returns null for unknown reference', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ docs: [] }) })
    const result = await resolveProductByReference('UNKNOWN-999')
    expect(result).toBeNull()
  })

  it('resolves REF-001 by sku', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (String(url).includes('skuErp')) {
        return {
          ok: true,
          json: async () => ({
            docs: [
              {
                skuErp: 'REF-001',
                slug: 'ref-001',
                title: 'Producto test',
                _status: 'published',
                isWildcard: false,
              },
            ],
          }),
        }
      }
      return { ok: true, json: async () => ({ docs: [] }) }
    })
    const result = await resolveProductByReference('REF-001')
    expect(result?.sku).toBe('REF-001')
    expect(result?.slug).toBe('ref-001')
    expect(result?.matchedBy).toBe('sku')
  })
})
