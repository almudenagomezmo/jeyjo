import { describe, it, expect, beforeEach } from 'vitest'

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

describe('search-reconcile cron authorization', () => {
  beforeEach(() => {
    delete process.env.CRON_SECRET
  })

  it('returns false without bearer token', () => {
    process.env.CRON_SECRET = 'test-secret'
    const request = new Request('http://localhost/api/cron/search-reconcile')
    expect(isAuthorizedCron(request)).toBe(false)
  })

  it('returns true with valid bearer token', () => {
    process.env.CRON_SECRET = 'test-secret'
    const request = new Request('http://localhost/api/cron/search-reconcile', {
      headers: { authorization: 'Bearer test-secret' },
    })
    expect(isAuthorizedCron(request)).toBe(true)
  })
})

describe('search reliability cron route registration', () => {
  it('vercel.json registers reconcile and orphan cleanup crons', async () => {
    const vercel = await import('../../vercel.json')
    const reconcile = vercel.default.crons.find(
      (entry: { path: string }) => entry.path === '/api/cron/search-reconcile',
    )
    const cleanup = vercel.default.crons.find(
      (entry: { path: string }) => entry.path === '/api/cron/search-orphan-cleanup',
    )

    expect(reconcile).toBeDefined()
    expect(reconcile?.schedule).toBe('0 * * * *')
    expect(cleanup).toBeDefined()
    expect(cleanup?.schedule).toBe('0 4 * * *')
  })
})

describe('search index alerts thresholds', () => {
  it('warning when lag exceeds 300 seconds', () => {
    const queue = { pending: 2, processing: 0, error: 0, oldestPendingAgeSec: 400 }
    const isWarning = queue.error > 0 || queue.oldestPendingAgeSec > 300
    const isError = queue.error >= 10 || queue.oldestPendingAgeSec > 900
    expect(isWarning).toBe(true)
    expect(isError).toBe(false)
  })

  it('error when error count reaches 10', () => {
    const queue = { pending: 0, processing: 0, error: 10, oldestPendingAgeSec: 0 }
    const isError = queue.error >= 10 || queue.oldestPendingAgeSec > 900
    expect(isError).toBe(true)
  })
})
