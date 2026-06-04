import type { SearchEntityType } from '@/lib/supabase-server'

import type { SearchEventPayload } from './types'

function joinParts(parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join(' ')
}

export function buildIndexText(
  entityType: SearchEntityType,
  payload: SearchEventPayload,
): string {
  if (entityType === 'categoria') {
    return joinParts([payload.title, payload.slug, payload.metaDescription, payload.keywords])
  }

  return joinParts([
    payload.title,
    payload.skuErp,
    payload.mainWholesaleRef,
    payload.oemRef,
    payload.ean,
    payload.categoryTitle ?? payload.categorySlug,
    payload.shortDescription,
    payload.metaDescription,
    payload.keywords,
    payload.slug,
  ])
}
