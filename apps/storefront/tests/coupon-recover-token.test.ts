import { createHmac } from 'node:crypto'
import { describe, expect, it, beforeEach, afterEach } from 'vitest'

import { verifyCartRecoverToken } from '@/lib/coupon/recover-token'

describe('verifyCartRecoverToken', () => {
  const prev = process.env.CART_RECOVER_SECRET

  beforeEach(() => {
    process.env.CART_RECOVER_SECRET = 'test-recover-secret-32chars!!!!'
  })

  afterEach(() => {
    if (prev === undefined) delete process.env.CART_RECOVER_SECRET
    else process.env.CART_RECOVER_SECRET = prev
  })

  it('accepts valid token', () => {
    const payload = {
      snapshotId: 'snap-1',
      lines: [{ productId: 'item-a', qty: 2 }],
      exp: Date.now() + 60_000,
    }
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const sig = createHmac('sha256', process.env.CART_RECOVER_SECRET!)
      .update(body)
      .digest('base64url')
    const token = `${body}.${sig}`

    const result = verifyCartRecoverToken(token)
    expect(result?.snapshotId).toBe('snap-1')
    expect(result?.lines).toHaveLength(1)
  })

  it('rejects expired token', () => {
    const payload = {
      snapshotId: 'snap-1',
      lines: [],
      exp: Date.now() - 1000,
    }
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const sig = createHmac('sha256', process.env.CART_RECOVER_SECRET!)
      .update(body)
      .digest('base64url')

    expect(verifyCartRecoverToken(`${body}.${sig}`)).toBeNull()
  })
})
