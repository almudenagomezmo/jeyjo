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
      payload: { title: 'Test product' },
    })

    expect(mockInsert).toHaveBeenCalledOnce()
    const row = mockInsert.mock.calls[0][0]
    expect(row.entity_type).toBe('producto')
    expect(row.entity_id).toBe(payloadIdToUuid('producto', 42))
    expect(row.action).toBe('upsert')
    expect(row.status).toBe('pending')
    expect(row.payload).toEqual({ title: 'Test product' })
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
    })

    expect(mockInsert).toHaveBeenCalledOnce()
    const row = mockInsert.mock.calls[0][0]
    expect(row.actor_user_id).toBe(payloadIdToUuid('payload-user', 1))
    expect(row.actor_name).toBe('admin@jeyjo.local')
    expect(row.entity_type).toBe('product')
    expect(row.entity_id).toBe(payloadIdToUuid('product', 99))
    expect(row.action).toBe('create')
    expect(row.new_value).toEqual({ title: 'Grifo' })
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
