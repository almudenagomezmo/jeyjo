import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from '@/app/api/intranet/catalog-downloads/route'

const requireB2bApiSession = vi.fn()
const fetchB2bCatalogDownloads = vi.fn()

vi.mock('@/lib/intranet/b2b-api-guard', () => ({
  requireB2bApiSession: (...args: unknown[]) => requireB2bApiSession(...args),
}))

vi.mock('@/lib/intranet/catalog-downloads/fetch-catalog-downloads', () => ({
  fetchB2bCatalogDownloads: (...args: unknown[]) => fetchB2bCatalogDownloads(...args),
}))

describe('catalog downloads API', () => {
  beforeEach(() => {
    requireB2bApiSession.mockReset()
    fetchB2bCatalogDownloads.mockReset()
  })

  it('GET returns 401 without B2B session', async () => {
    requireB2bApiSession.mockResolvedValue({
      error: Response.json({ error: 'Unauthorized' }, { status: 401 }),
    })
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('GET returns 403 for subuser without orders permission', async () => {
    requireB2bApiSession.mockResolvedValue({
      error: Response.json({ error: 'Forbidden' }, { status: 403 }),
    })
    const res = await GET()
    expect(res.status).toBe(403)
    expect(requireB2bApiSession).toHaveBeenCalledWith({ section: 'orders' })
  })

  it('GET returns vigente items for validated B2B', async () => {
    requireB2bApiSession.mockResolvedValue({
      ctx: { customerGroup: 2, validatedAt: '2026-01-01' },
    })
    fetchB2bCatalogDownloads.mockResolvedValue([
      {
        id: 1,
        title: 'Catálogo General 2026',
        description: null,
        documentType: 'catalog',
        validFrom: '2026-01-01',
        validUntil: '2026-12-31',
        downloadUrl: 'https://cms.example/media/cat.pdf',
        coverImageUrl: null,
      },
    ])

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.items).toHaveLength(1)
    expect(fetchB2bCatalogDownloads).toHaveBeenCalledWith({ customerGroup: 2 })
  })
})
