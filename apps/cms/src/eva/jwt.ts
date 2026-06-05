import jwt from 'jsonwebtoken'

import type { EvaContextClaims } from '@/eva/types'

const DEFAULT_TTL_SEC = 15 * 60

export function getEvaContextJwtSecret(): string {
  const secret = process.env.EVA_CONTEXT_JWT_SECRET?.trim()
  if (!secret) {
    if (process.env.NODE_ENV === 'development') {
      return 'dev-eva-context-jwt-secret-change-me'
    }
    throw new Error('EVA_CONTEXT_JWT_SECRET is required in non-development environments')
  }
  return secret
}

export function signEvaContextToken(
  claims: Omit<EvaContextClaims, 'iat' | 'exp'>,
  ttlSec = DEFAULT_TTL_SEC,
): string {
  return jwt.sign(claims, getEvaContextJwtSecret(), {
    algorithm: 'HS256',
    expiresIn: ttlSec,
  })
}

export function verifyEvaContextToken(token: string): EvaContextClaims {
  const decoded = jwt.verify(token, getEvaContextJwtSecret(), {
    algorithms: ['HS256'],
  })
  if (typeof decoded !== 'object' || decoded === null) {
    throw new Error('Invalid EVA context token payload')
  }
  const sub = (decoded as EvaContextClaims).sub
  const channel = (decoded as EvaContextClaims).channel
  const page = (decoded as EvaContextClaims).page
  if (!sub || !channel || !page?.path) {
    throw new Error('Invalid EVA context token claims')
  }
  return decoded as EvaContextClaims
}
