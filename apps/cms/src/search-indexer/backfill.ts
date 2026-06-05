import type { Payload } from 'payload'

import { enqueueSearchEvent } from '@/lib/supabase-server'

import { buildSearchPayload } from '@/hooks/searchEventHooks'
import { hasActiveSearchEvent } from './searchEvents'
import type { SearchBackfillResult } from './types'

const PAGE_SIZE = 100

async function backfillProducts(payload: Payload): Promise<{ enqueued: number; skippedDuplicate: number }> {
  let page = 1
  let enqueued = 0
  let skippedDuplicate = 0

  while (true) {
    const result = await payload.find({
      collection: 'products',
      where: {
        and: [
          { _status: { equals: 'published' } },
          {
            or: [{ isWildcard: { equals: false } }, { isWildcard: { exists: false } }],
          },
        ],
      },
      limit: PAGE_SIZE,
      page,
      depth: 0,
      overrideAccess: true,
    })

    if (!result.docs.length) break

    for (const doc of result.docs) {
      if (await hasActiveSearchEvent('producto', doc.id)) {
        skippedDuplicate += 1
        continue
      }

      await enqueueSearchEvent({
        entityType: 'producto',
        entityId: doc.id,
        action: 'update',
        payload: {
          ...buildSearchPayload(doc as unknown as Record<string, unknown>),
          source: 'backfill',
        },
      })
      enqueued += 1
    }

    if (!result.hasNextPage) break
    page += 1
  }

  return { enqueued, skippedDuplicate }
}

async function backfillCategories(payload: Payload): Promise<{ enqueued: number; skippedDuplicate: number }> {
  let page = 1
  let enqueued = 0
  let skippedDuplicate = 0

  while (true) {
    const result = await payload.find({
      collection: 'categories',
      limit: PAGE_SIZE,
      page,
      depth: 0,
      overrideAccess: true,
    })

    if (!result.docs.length) break

    for (const doc of result.docs) {
      if (await hasActiveSearchEvent('categoria', doc.id)) {
        skippedDuplicate += 1
        continue
      }

      await enqueueSearchEvent({
        entityType: 'categoria',
        entityId: doc.id,
        action: 'update',
        payload: {
          ...buildSearchPayload(doc as unknown as Record<string, unknown>),
          source: 'backfill',
        },
      })
      enqueued += 1
    }

    if (!result.hasNextPage) break
    page += 1
  }

  return { enqueued, skippedDuplicate }
}

export async function runSearchBackfill(payload: Payload): Promise<SearchBackfillResult> {
  const started = Date.now()

  const [products, categories] = await Promise.all([
    backfillProducts(payload),
    backfillCategories(payload),
  ])

  return {
    enqueuedProducts: products.enqueued,
    enqueuedCategories: categories.enqueued,
    skippedDuplicate: products.skippedDuplicate + categories.skippedDuplicate,
    durationMs: Date.now() - started,
  }
}
