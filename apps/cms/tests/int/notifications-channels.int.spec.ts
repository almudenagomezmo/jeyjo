import { describe, expect, it } from 'vitest'

import { allowsEmail, allowsPortal } from '@/lib/notifications/channels'

describe('notification channels', () => {
  it('portal-only skips email', () => {
    expect(allowsPortal('portal')).toBe(true)
    expect(allowsEmail('portal', false)).toBe(false)
  })

  it('off blocks portal and email', () => {
    expect(allowsPortal('off')).toBe(false)
    expect(allowsEmail('off', false)).toBe(false)
  })

  it('email disabled blocks email only', () => {
    expect(allowsEmail('email', true)).toBe(false)
    expect(allowsPortal('email')).toBe(true)
  })
})
