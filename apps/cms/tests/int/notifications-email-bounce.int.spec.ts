import { describe, expect, it } from 'vitest'

import { isHardBounceError } from '@/lib/notifications/emails/send-proactive-email'

describe('email hard bounce detection', () => {
  it('detects permanent bounce messages', () => {
    expect(isHardBounceError(new Error('Hard bounce for recipient'))).toBe(true)
    expect(isHardBounceError(new Error('temporary failure'))).toBe(false)
  })
})
