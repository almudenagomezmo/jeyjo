import { describe, it, expect } from 'vitest'

import { extractSourceIp } from '@/lib/request-ip'

describe('extractSourceIp', () => {
  it('prefers first x-forwarded-for hop', () => {
    const headers = new Headers({
      'x-forwarded-for': '203.0.113.1, 10.0.0.1',
    })
    expect(extractSourceIp(headers)).toBe('203.0.113.1')
  })

  it('falls back to x-real-ip', () => {
    const headers = new Headers({ 'x-real-ip': '198.51.100.42' })
    expect(extractSourceIp(headers)).toBe('198.51.100.42')
  })

  it('returns null when no proxy headers', () => {
    expect(extractSourceIp(new Headers())).toBeNull()
  })
})
