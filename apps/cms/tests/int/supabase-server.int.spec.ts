import { describe, it, expect, vi, beforeEach } from 'vitest'

import { payloadIdToUuid } from '@/lib/entity-uuid'

const mockInsert = vi.fn().mockResolvedValue({ error: null })

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: mockInsert,
    })),
  })),
}))

describe('supabase-server', () => {
  beforeEach(() => {
    vi.resetModules()
    mockInsert.mockClear()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('enqueueSearchEvent maps create to upsert with typed payload', async () => {
    const { enqueueSearchEvent } = await import('@/lib/supabase-server')

    await enqueueSearchEvent({
      entityType: 'producto',
      entityId: 42,
      action: 'create',
      payload: {
        title: 'Test product',
        skuErp: 'REF-001',
        ean: '8412345678901',
        isWildcard: false,
        _status: 'published',
        payloadEntityId: 42,
      },
    })

    expect(mockInsert).toHaveBeenCalledOnce()
    const row = mockInsert.mock.calls[0][0]
    expect(row.entity_type).toBe('producto')
    expect(row.entity_id).toBe(payloadIdToUuid('producto', 42))
    expect(row.action).toBe('upsert')
    expect(row.status).toBe('pending')
    expect(row.payload).toEqual({
      title: 'Test product',
      skuErp: 'REF-001',
      ean: '8412345678901',
      isWildcard: false,
      _status: 'published',
      payloadEntityId: 42,
    })
  })

  it('enqueueSearchEvent maps delete action', async () => {
    const { enqueueSearchEvent } = await import('@/lib/supabase-server')

    await enqueueSearchEvent({
      entityType: 'categoria',
      entityId: '7',
      action: 'delete',
      payload: { slug: 'fontaneria' },
    })

    const row = mockInsert.mock.calls[0][0]
    expect(row.action).toBe('delete')
    expect(row.entity_id).toBe(payloadIdToUuid('categoria', '7'))
  })

  it('writeAuditLog inserts audit row with actor and entity uuids', async () => {
    const { writeAuditLog } = await import('@/lib/supabase-server')

    await writeAuditLog({
      actorId: 1,
      actorName: 'admin@jeyjo.local',
      entityType: 'product',
      entityId: 99,
      action: 'create',
      metadata: { title: 'Grifo' },
      sourceIp: '203.0.113.5',
      previousValue: { p1Price: 10 },
    })

    expect(mockInsert).toHaveBeenCalledOnce()
    const row = mockInsert.mock.calls[0][0]
    expect(row.actor_user_id).toBe(payloadIdToUuid('payload-user', 1))
    expect(row.actor_name).toBe('admin@jeyjo.local')
    expect(row.entity_type).toBe('product')
    expect(row.entity_id).toBe(payloadIdToUuid('product', 99))
    expect(row.action).toBe('create')
    expect(row.new_value).toEqual({ title: 'Grifo' })
    expect(row.previous_value).toEqual({ p1Price: 10 })
    expect(row.source_ip).toBe('203.0.113.5')
  })

  it('writeSecurityAudit maps to security entity type', async () => {
    const { writeSecurityAudit } = await import('@/lib/supabase-server')

    await writeSecurityAudit({
      action: 'ACCESS_DENIED',
      actorId: 2,
      actorName: 'catalog@jeyjo.local',
      metadata: { collection: 'orders' },
      sourceIp: '10.0.0.1',
    })

    const row = mockInsert.mock.calls[0][0]
    expect(row.entity_type).toBe('security')
    expect(row.action).toBe('ACCESS_DENIED')
    expect(row.source_ip).toBe('10.0.0.1')
  })
})

describe('resolveDisplayImage', () => {
  it('prefers own image over provider URL', async () => {
    const { resolveDisplayImage } = await import('@/utilities/resolveDisplayImage')

    expect(
      resolveDisplayImage({
        ownImage: { url: 'https://cdn.jeyjo.local/own.jpg' },
        providerImageUrl: 'https://provider.com/img.jpg',
      }),
    ).toBe('https://cdn.jeyjo.local/own.jpg')

    expect(
      resolveDisplayImage({
        providerImageUrl: 'https://provider.com/img.jpg',
      }),
    ).toBe('https://provider.com/img.jpg')

    expect(resolveDisplayImage({})).toBeNull()
  })
})
