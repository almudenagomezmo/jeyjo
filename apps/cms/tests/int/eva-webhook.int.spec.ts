import { describe, expect, it, vi } from 'vitest'

import { ingestSkaiOrder } from '@/eva/ingest-order'
import { signSkaiWebhookBody, verifySkaiWebhookSignature } from '@/eva/webhook-signature'

describe('EVA webhook security', () => {
  it('rejects invalid signature', () => {
    vi.stubEnv('SKAI_WEBHOOK_SECRET', 'whsec-test')
    const body = JSON.stringify({ skaiExternalId: 'ext-1', lines: [] })
    expect(verifySkaiWebhookSignature(body, 'bad-signature')).toBe(false)
  })

  it('accepts valid HMAC signature', () => {
    vi.stubEnv('SKAI_WEBHOOK_SECRET', 'whsec-test')
    const body = JSON.stringify({ hello: 'world' })
    const sig = signSkaiWebhookBody(body, 'whsec-test')
    expect(verifySkaiWebhookSignature(body, sig)).toBe(true)
  })
})

describe('EVA order ingestion idempotency', () => {
  it('returns existing order on duplicate skaiExternalId', async () => {
    let stored: { id: number; orderNumber: string } | null = null

    const find = vi.fn(async () => ({
      docs: stored ? [stored] : [],
    }))

    const create = vi.fn(async () => {
      stored = { id: 42, orderNumber: 'EVA-ext-dup' }
      return stored
    })

    const payload = { find, create } as never

    const input = {
      skaiExternalId: 'ext-dup',
      lines: [{ skuErp: 'REF-1', name: 'Test', qty: 1, unitPrice: 10 }],
    }

    const first = await ingestSkaiOrder(payload, input)
    expect(first.created).toBe(true)

    const second = await ingestSkaiOrder(payload, input)
    expect(second.created).toBe(false)
    expect(second.id).toBe(42)
    expect(create).toHaveBeenCalledTimes(1)
  })
})
