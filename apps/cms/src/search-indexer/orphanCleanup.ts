import type { Payload } from 'payload'

import { deletePoints, scrollPointBatch } from '@/lib/qdrant'

import { getOrphanCleanupMaxDeletes } from './config'
import type { SearchOrphanCleanupResult } from './types'

type CollectionTarget = {
  collection: 'products' | 'categories'
  payloadCollection: 'products' | 'categories'
}

const TARGETS: CollectionTarget[] = [
  { collection: 'products', payloadCollection: 'products' },
  { collection: 'categories', payloadCollection: 'categories' },
]

async function shouldDeleteProductPoint(
  payload: Payload,
  payloadId: string | number,
): Promise<boolean> {
  try {
    const product = await payload.findByID({
      collection: 'products',
      id: payloadId,
      depth: 0,
      overrideAccess: true,
    })

    if (product._status !== 'published') return true
    if (product.isWildcard === true) return true
    return false
  } catch {
    return true
  }
}

async function shouldDeleteCategoryPoint(
  payload: Payload,
  payloadId: string | number,
): Promise<boolean> {
  try {
    await payload.findByID({
      collection: 'categories',
      id: payloadId,
      depth: 0,
      overrideAccess: true,
    })
    return false
  } catch {
    return true
  }
}

async function cleanupCollection(
  payload: Payload,
  target: CollectionTarget,
  remainingBudget: number,
): Promise<{ deleted: number; scanned: number }> {
  let deleted = 0
  let scanned = 0
  let offset: string | number | Record<string, unknown> | null = null

  while (deleted < remainingBudget) {
    const batch = await scrollPointBatch(target.collection, { limit: 128, offset })
    if (!batch.points.length) break

    const toDelete: (string | number)[] = []

    for (const point of batch.points) {
      if (deleted + toDelete.length >= remainingBudget) break
      scanned += 1

      const payloadId = point.payload?.payloadId
      if (typeof payloadId !== 'string' && typeof payloadId !== 'number') {
        toDelete.push(point.id)
        continue
      }

      const remove =
        target.payloadCollection === 'products'
          ? await shouldDeleteProductPoint(payload, payloadId)
          : await shouldDeleteCategoryPoint(payload, payloadId)

      if (remove) {
        toDelete.push(point.id)
      }
    }

    if (toDelete.length) {
      await deletePoints(target.collection, toDelete)
      deleted += toDelete.length
    }

    if (!batch.nextOffset) break
    offset = batch.nextOffset
  }

  return { deleted, scanned }
}

export async function runSearchOrphanCleanup(payload: Payload): Promise<SearchOrphanCleanupResult> {
  const started = Date.now()
  const maxDeletes = getOrphanCleanupMaxDeletes()
  let orphansDeleted = 0
  let scanned = 0

  for (const target of TARGETS) {
    const budget = maxDeletes - orphansDeleted
    if (budget <= 0) break

    const result = await cleanupCollection(payload, target, budget)
    orphansDeleted += result.deleted
    scanned += result.scanned
  }

  return {
    orphansDeleted,
    scanned,
    durationMs: Date.now() - started,
  }
}
