import type { Payload } from 'payload'

import { getCollectionPointCount } from '@/lib/qdrant'

export type QdrantCoverageStats = {
  qdrantProductPoints: number | null
  publishedProductCount: number
  ratio: number | null
}

const CACHE_MS = 5 * 60 * 1000
let cached: { at: number; stats: QdrantCoverageStats } | null = null

export async function getPublishedProductCount(payload: Payload): Promise<number> {
  const result = await payload.count({
    collection: 'products',
    where: {
      and: [
        { _status: { equals: 'published' } },
        {
          or: [{ isWildcard: { equals: false } }, { isWildcard: { exists: false } }],
        },
      ],
    },
    overrideAccess: true,
  })

  return result.totalDocs
}

export async function getQdrantCoverageStats(payload: Payload): Promise<QdrantCoverageStats> {
  const now = Date.now()
  if (cached && now - cached.at < CACHE_MS) {
    return cached.stats
  }

  const publishedProductCount = await getPublishedProductCount(payload)
  let qdrantProductPoints: number | null = null
  let ratio: number | null = null

  if (process.env.QDRANT_URL?.trim()) {
    try {
      qdrantProductPoints = await getCollectionPointCount('products')
      ratio =
        publishedProductCount > 0 && qdrantProductPoints != null
          ? qdrantProductPoints / publishedProductCount
          : null
    } catch {
      qdrantProductPoints = null
      ratio = null
    }
  }

  const stats: QdrantCoverageStats = {
    qdrantProductPoints,
    publishedProductCount,
    ratio,
  }

  cached = { at: now, stats }
  return stats
}

export function resetQdrantCoverageCacheForTests(): void {
  cached = null
}
