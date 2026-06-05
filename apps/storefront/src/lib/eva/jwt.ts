import { createHmac } from 'crypto'

import type { EvaContextChannel, EvaPageContext } from '@/lib/eva/types'

const DEFAULT_TTL_SEC = 15 * 60

function base64Url(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url')
}

function getEvaContextJwtSecret(): string {
  const secret = process.env.EVA_CONTEXT_JWT_SECRET?.trim()
  if (!secret) {
    if (process.env.NODE_ENV === 'development') {
      return 'dev-eva-context-jwt-secret-change-me'
    }
    throw new Error('EVA_CONTEXT_JWT_SECRET is required')
  }
  return secret
}

export function signEvaContextToken(input: {
  sub: string | 'anonymous'
  channel: EvaContextChannel
  page: EvaPageContext
  ttlSec?: number
}): string {
  const ttlSec = input.ttlSec ?? DEFAULT_TTL_SEC
  const now = Math.floor(Date.now() / 1000)
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64Url(
    JSON.stringify({
      sub: input.sub,
      channel: input.channel,
      page: input.page,
      iat: now,
      exp: now + ttlSec,
    }),
  )
  const secret = getEvaContextJwtSecret()
  const sig = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${sig}`
}
