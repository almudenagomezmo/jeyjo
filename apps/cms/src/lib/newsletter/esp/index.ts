import type { Payload } from 'payload'

import { createBrevoEspAdapter } from './brevo'
import { createNoopEspAdapter } from './noop'
import type { NewsletterEspPort } from './types'

export function resolveBrevoListId(override?: number | null): number | null {
  if (override != null && override > 0) return override
  const env = process.env.BREVO_NEWSLETTER_LIST_ID
  if (!env) return null
  const parsed = Number(env)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function createNewsletterEspPort(payload?: Payload, listIdOverride?: number | null): NewsletterEspPort {
  const apiKey = process.env.BREVO_API_KEY?.trim()
  const listId = resolveBrevoListId(listIdOverride)
  if (!apiKey || !listId) {
    return createNoopEspAdapter(payload ? { info: (msg) => payload.logger.info(msg) } : undefined)
  }
  return createBrevoEspAdapter({
    apiKey,
    listId,
    logger: payload ? { error: (msg) => payload.logger.error(msg) } : undefined,
  })
}

export type { NewsletterEspPort } from './types'
