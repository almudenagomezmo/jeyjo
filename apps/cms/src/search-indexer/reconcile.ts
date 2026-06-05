import type { Payload } from 'payload'

import { payloadIdToUuid } from '@/lib/entity-uuid'
import { enqueueSearchEvent, type SearchEntityType } from '@/lib/supabase-server'

import { buildSearchPayload } from '@/hooks/searchEventHooks'
import { getReconcileErrorWindowHours, getReconcileStaleHours } from './config'
import {
  getLastDoneProcessedAtByEntityIds,
  hasActiveSearchEvent,
  resetRecentErrorEventsForReconcile,
} from './searchEvents'
import type { SearchReconcileResult } from './types'

const PAGE_SIZE = 100

function isStale(updatedAt: string, lastDoneAt: string | undefined, staleMs: number): boolean {
  if (!lastDoneAt) return true
  const updated = new Date(updatedAt).getTime()
  const indexed = new Date(lastDoneAt).getTime()
  return updated > indexed + staleMs
}

async function enqueueIfStale(input: {
  entityType: SearchEntityType
  entityId: string | number
  doc: Record<string, unknown>
  updatedAt: string
  lastDoneAt: string | undefined
  staleMs: number
}): Promise<'enqueued' | 'skippedFresh' | 'skippedDuplicate'> {
  if (!isStale(input.updatedAt, input.lastDoneAt, input.staleMs)) {
    return 'skippedFresh'
  }

  if (await hasActiveSearchEvent(input.entityType, input.entityId)) {
    return 'skippedDuplicate'
  }

  await enqueueSearchEvent({
    entityType: input.entityType,
    entityId: input.entityId,
    action: 'update',
    payload: { ...buildSearchPayload(input.doc), source: 'reconcile' },
  })

  return 'enqueued'
}

async function reconcileProducts(payload: Payload, staleMs: number): Promise<{
  enqueued: number
  skippedDuplicate: number
}> {
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

    const entityUuids = result.docs.map((doc) => payloadIdToUuid('producto', doc.id))
    const lastDone = await getLastDoneProcessedAtByEntityIds('producto', entityUuids)

    for (const doc of result.docs) {
      const entityUuid = payloadIdToUuid('producto', doc.id)
      const outcome = await enqueueIfStale({
        entityType: 'producto',
        entityId: doc.id,
        doc: doc as unknown as Record<string, unknown>,
        updatedAt: doc.updatedAt,
        lastDoneAt: lastDone.get(entityUuid),
        staleMs,
      })

      if (outcome === 'enqueued') enqueued += 1
      if (outcome === 'skippedDuplicate') skippedDuplicate += 1
    }

    if (!result.hasNextPage) break
    page += 1
  }

  return { enqueued, skippedDuplicate }
}

async function reconcileCategories(payload: Payload, staleMs: number): Promise<{
  enqueued: number
  skippedDuplicate: number
}> {
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

    const entityUuids = result.docs.map((doc) => payloadIdToUuid('categoria', doc.id))
    const lastDone = await getLastDoneProcessedAtByEntityIds('categoria', entityUuids)

    for (const doc of result.docs) {
      const entityUuid = payloadIdToUuid('categoria', doc.id)
      const outcome = await enqueueIfStale({
        entityType: 'categoria',
        entityId: doc.id,
        doc: doc as unknown as Record<string, unknown>,
        updatedAt: doc.updatedAt,
        lastDoneAt: lastDone.get(entityUuid),
        staleMs,
      })

      if (outcome === 'enqueued') enqueued += 1
      if (outcome === 'skippedDuplicate') skippedDuplicate += 1
    }

    if (!result.hasNextPage) break
    page += 1
  }

  return { enqueued, skippedDuplicate }
}

export async function runSearchReconcile(payload: Payload): Promise<SearchReconcileResult> {
  const started = Date.now()
  const staleMs = getReconcileStaleHours() * 60 * 60 * 1000
  const errorWindowHours = getReconcileErrorWindowHours()

  const [products, categories, errorsReset] = await Promise.all([
    reconcileProducts(payload, staleMs),
    reconcileCategories(payload, staleMs),
    resetRecentErrorEventsForReconcile(errorWindowHours),
  ])

  return {
    staleProductsEnqueued: products.enqueued,
    staleCategoriesEnqueued: categories.enqueued,
    skippedDuplicate: products.skippedDuplicate + categories.skippedDuplicate,
    errorsReset,
    durationMs: Date.now() - started,
  }
}
