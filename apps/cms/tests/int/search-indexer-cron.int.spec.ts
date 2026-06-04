import { describe, it, expect, beforeEach } from 'vitest'

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

describe('search-indexer cron authorization', () => {
  beforeEach(() => {
    delete process.env.CRON_SECRET
  })

  it('returns false without bearer token', () => {
    process.env.CRON_SECRET = 'test-secret'
    const request = new Request('http://localhost/api/cron/search-indexer')
    expect(isAuthorizedCron(request)).toBe(false)
  })

  it('returns true with valid bearer token', () => {
    process.env.CRON_SECRET = 'test-secret'
    const request = new Request('http://localhost/api/cron/search-indexer', {
      headers: { authorization: 'Bearer test-secret' },
    })
    expect(isAuthorizedCron(request)).toBe(true)
  })
})

describe('search-indexer cron route registration', () => {
  it('vercel.json registers /api/cron/search-indexer every minute', async () => {
    const vercel = await import('../../vercel.json')
    const cron = vercel.default.crons.find(
      (entry: { path: string }) => entry.path === '/api/cron/search-indexer',
    )
    expect(cron).toBeDefined()
    expect(cron?.schedule).toBe('* * * * *')
  })
})
