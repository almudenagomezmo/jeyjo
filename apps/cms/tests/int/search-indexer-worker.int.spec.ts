import { describe, it, expect, vi, beforeEach } from 'vitest'

import { payloadIdToUuid } from '@/lib/entity-uuid'

const claimSearchEvents = vi.fn()
const completeSearchEvent = vi.fn().mockResolvedValue(undefined)
const failSearchEvent = vi.fn().mockResolvedValue('error')
const upsertPoints = vi.fn().mockResolvedValue(undefined)
const deletePoints = vi.fn().mockResolvedValue(undefined)
const embedDocumentText = vi.fn().mockResolvedValue(Array.from({ length: 384 }, () => 0.01))

vi.mock('@/search-indexer/searchEvents', () => ({
  claimSearchEvents: (...args: unknown[]) => claimSearchEvents(...args),
  completeSearchEvent: (...args: unknown[]) => completeSearchEvent(...args),
  failSearchEvent: (...args: unknown[]) => failSearchEvent(...args),
  eventPayload: (event: { payload: Record<string, unknown> }) => event.payload,
}))

vi.mock('@/lib/qdrant', () => ({
  upsertPoints: (...args: unknown[]) => upsertPoints(...args),
  deletePoints: (...args: unknown[]) => deletePoints(...args),
}))

vi.mock('@/search-indexer/embedding', () => ({
  embedDocumentText: (...args: unknown[]) => embedDocumentText(...args),
}))

import { runSearchIndexerBatch } from '@/search-indexer/worker'

function mockLogger() {
  return { info: vi.fn(), error: vi.fn() }
}

describe('search-indexer worker batch', () => {
  beforeEach(() => {
    claimSearchEvents.mockReset()
    completeSearchEvent.mockClear()
    failSearchEvent.mockClear()
    upsertPoints.mockClear()
    deletePoints.mockClear()
    embedDocumentText.mockClear()
  })

  it('skips wildcard product upsert and deletes existing point', async () => {
    const entityId = payloadIdToUuid('producto', 99)
    claimSearchEvents.mockResolvedValue([
      {
        id: '22222222-2222-2222-2222-222222222222',
        entity_type: 'producto',
        entity_id: entityId,
        action: 'upsert',
        payload: {
          title: 'Comodín',
          isWildcard: true,
          _status: 'published',
          payloadEntityId: 99,
        },
        status: 'processing',
        error_message: null,
        created_at: new Date().toISOString(),
        processed_at: null,
      },
    ])

    const result = await runSearchIndexerBatch({
      payload: { logger: mockLogger(), findByID: vi.fn() } as never,
    })

    expect(result.skippedWildcard).toBe(1)
    expect(upsertPoints).not.toHaveBeenCalled()
    expect(deletePoints).toHaveBeenCalledWith('products', [entityId])
    expect(completeSearchEvent).toHaveBeenCalled()
  })

  it('does not use meta.image for thumbnailUrl (catalog only)', async () => {
    const entityId = payloadIdToUuid('producto', 88)
    claimSearchEvents.mockResolvedValue([
      {
        id: '66666666-6666-6666-6666-666666666666',
        entity_type: 'producto',
        entity_id: entityId,
        action: 'upsert',
        payload: {
          title: 'SEO only image',
          payloadEntityId: 88,
        },
        status: 'processing',
        error_message: null,
        created_at: new Date().toISOString(),
        processed_at: null,
      },
    ])

    const findByID = vi.fn().mockResolvedValue({
      id: 88,
      title: 'SEO only image',
      slug: 'seo-only',
      skuErp: 'REF-SEO',
      ean: '8412222222222',
      _status: 'published',
      isWildcard: false,
      categories: [],
      ownImage: null,
      providerImageUrl: null,
      meta: { image: { url: '/media/seo-only.jpg' } },
    })

    await runSearchIndexerBatch({
      payload: { logger: mockLogger(), findByID } as never,
    })

    expect(upsertPoints).toHaveBeenCalledWith(
      'products',
      expect.arrayContaining([
        expect.objectContaining({
          payload: expect.objectContaining({
            thumbnailUrl: null,
          }),
        }),
      ]),
    )
  })

  it('loads ERP fields from Payload when hook payload is minimal', async () => {
    const entityId = payloadIdToUuid('producto', 77)
    claimSearchEvents.mockResolvedValue([
      {
        id: '55555555-5555-5555-5555-555555555555',
        entity_type: 'producto',
        entity_id: entityId,
        action: 'upsert',
        payload: {
          title: 'Minimal',
          payloadEntityId: 77,
        },
        status: 'processing',
        error_message: null,
        created_at: new Date().toISOString(),
        processed_at: null,
      },
    ])

    const findByID = vi.fn().mockResolvedValue({
      id: 77,
      title: 'Loaded product',
      slug: 'loaded-product',
      skuErp: 'REF-LOADED',
      ean: '8411111111111',
      _status: 'published',
      isWildcard: false,
      categories: [{ slug: 'fontaneria', title: 'Fontanería' }],
      p1Price: 12.5,
      ownImage: null,
      providerImageUrl: null,
    })

    await runSearchIndexerBatch({
      payload: { logger: mockLogger(), findByID } as never,
    })

    expect(findByID).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'products', id: 77 }),
    )
    expect(upsertPoints).toHaveBeenCalledWith(
      'products',
      expect.arrayContaining([
        expect.objectContaining({
          payload: expect.objectContaining({
            skuErp: 'REF-LOADED',
            ean: '8411111111111',
          }),
        }),
      ]),
    )
  })

  it('delete event removes Qdrant point', async () => {
    const entityId = payloadIdToUuid('producto', 9002)
    claimSearchEvents.mockResolvedValue([
      {
        id: '33333333-3333-3333-3333-333333333333',
        entity_type: 'producto',
        entity_id: entityId,
        action: 'delete',
        payload: {},
        status: 'processing',
        error_message: null,
        created_at: new Date().toISOString(),
        processed_at: null,
      },
    ])

    await runSearchIndexerBatch({
      payload: { logger: mockLogger(), findByID: vi.fn() } as never,
    })

    expect(deletePoints).toHaveBeenCalledWith('products', [entityId])
    expect(upsertPoints).not.toHaveBeenCalled()
  })

  it('marks event failed when Qdrant upsert throws', async () => {
    claimSearchEvents.mockResolvedValue([
      {
        id: '44444444-4444-4444-4444-444444444444',
        entity_type: 'producto',
        entity_id: payloadIdToUuid('producto', 55),
        action: 'upsert',
        payload: {
          title: 'Fail product',
          skuErp: 'REF-FAIL',
          mainWholesaleRef: 'WH-FAIL',
          oemRef: 'OEM-FAIL',
          ean: '8410000000000',
          _status: 'published',
          isWildcard: false,
          payloadEntityId: 55,
        },
        status: 'processing',
        error_message: null,
        created_at: new Date().toISOString(),
        processed_at: null,
      },
    ])
    upsertPoints.mockRejectedValueOnce(new Error('Qdrant unavailable'))

    const result = await runSearchIndexerBatch({
      payload: { logger: mockLogger(), findByID: vi.fn() } as never,
    })

    expect(result.failed).toBe(1)
    expect(failSearchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ id: '44444444-4444-4444-4444-444444444444' }),
      'Qdrant unavailable',
    )
  })
})

describe('buildSearchPayload', () => {
  it('includes ERP fields and status for product enqueue', async () => {
    const { buildSearchPayload } = await import('@/hooks/searchEventHooks')

    const payload = buildSearchPayload({
      id: 42,
      title: 'Grifo',
      slug: 'grifo',
      skuErp: 'REF-001',
      mainWholesaleRef: 'WH-001',
      oemRef: 'OEM-001',
      ean: '8412345678901',
      isWildcard: false,
      _status: 'published',
    })

    expect(payload).toMatchObject({
      skuErp: 'REF-001',
      mainWholesaleRef: 'WH-001',
      oemRef: 'OEM-001',
      ean: '8412345678901',
      isWildcard: false,
      _status: 'published',
      payloadEntityId: 42,
    })
  })
})
