import { describe, it, expect, vi } from 'vitest'

import { payloadIdToUuid } from '@/lib/entity-uuid'

const runLiveTest = process.env.SEARCH_INDEXER_LIVE_TEST === 'true'

describe.skipIf(!runLiveTest)('search-indexer live Qdrant', () => {
  it('enqueue product event → worker → Qdrant point exists', async () => {
    vi.doMock('@/search-indexer/embedding', () => ({
      embedDocumentText: vi.fn().mockResolvedValue(Array.from({ length: 384 }, () => 0.01)),
    }))

    const entityId = payloadIdToUuid('producto', 9001)
    const { getSupabaseServerClient } = await import('@/lib/supabase-server')
    const supabase = getSupabaseServerClient()
    expect(supabase).toBeTruthy()

    await supabase!.from('search_events').delete().eq('entity_id', entityId)
    await supabase!.from('search_events').insert({
      entity_type: 'producto',
      entity_id: entityId,
      action: 'upsert',
      status: 'pending',
      payload: {
        title: 'Test indexer product',
        slug: 'test-indexer-product',
        skuErp: 'REF-001',
        ean: '8412345678901',
        _status: 'published',
        isWildcard: false,
        payloadEntityId: 9001,
      },
    })

    const { runSearchIndexerBatch } = await import('@/search-indexer/worker')
    const { qdrant } = await import('@/lib/qdrant')

    const result = await runSearchIndexerBatch({
      payload: { logger: { info: vi.fn(), error: vi.fn() }, findByID: vi.fn() } as never,
    })
    expect(result.succeeded).toBeGreaterThanOrEqual(1)

    const points = await qdrant.retrieve('products', { ids: [entityId], with_payload: true })
    expect(points).toHaveLength(1)
    expect(points[0]?.payload?.skuErp).toBe('REF-001')

    await qdrant.delete('products', { wait: true, points: [entityId] })
    await supabase!.from('search_events').delete().eq('entity_id', entityId)
  })
})
