import 'server-only'

import { embedQueryText } from '@jeyjo/search-embedding'

const TTL_MS = 60_000
const MAX_ENTRIES = 100

type CacheEntry = {
  vector: number[]
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()

function normalizeKey(q: string): string {
  return q.trim().toLowerCase()
}

export function resetEmbeddingCacheForTests(): void {
  cache.clear()
}

export async function getCachedQueryEmbedding(q: string): Promise<number[]> {
  const key = normalizeKey(q)
  const now = Date.now()
  const hit = cache.get(key)

  if (hit && hit.expiresAt > now) {
    return hit.vector
  }

  const vector = await embedQueryText(q)

  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest) cache.delete(oldest)
  }

  cache.set(key, { vector, expiresAt: now + TTL_MS })
  return vector
}
