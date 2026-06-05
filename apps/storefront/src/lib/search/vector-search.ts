import 'server-only'

import { searchPoints } from '@/lib/qdrant/client'

import { getCachedQueryEmbedding } from './embedding-cache'
import type { QdrantCategoryPayload, QdrantProductPayload } from './types'

export type VectorSearchHit = {
  sku: string
  score: number
  payload: QdrantProductPayload
}

export async function vectorSearchProductSkus(
  q: string,
  options?: { limit?: number },
): Promise<VectorSearchHit[]> {
  const trimmed = q.trim()
  if (trimmed.length < 3) return []

  const vector = await getCachedQueryEmbedding(trimmed)
  const limit = options?.limit ?? 10

  const hits = await searchPoints('products', vector, { limit })

  const out: VectorSearchHit[] = []
  for (const hit of hits) {
    const payload = (hit.payload ?? {}) as QdrantProductPayload
    const sku = payload.skuErp?.trim()
    if (!sku) continue
    out.push({ sku, score: hit.score, payload })
  }
  return out
}

export async function vectorSearchCategories(
  q: string,
  options?: { limit?: number },
): Promise<Array<{ slug: string; label: string; score: number }>> {
  const trimmed = q.trim()
  if (trimmed.length < 3) return []

  const vector = await getCachedQueryEmbedding(trimmed)
  const limit = options?.limit ?? 4

  const hits = await searchPoints('categories', vector, { limit })

  const out: Array<{ slug: string; label: string; score: number }> = []
  for (const hit of hits) {
    const payload = (hit.payload ?? {}) as QdrantCategoryPayload
    const slug = payload.slug?.trim()
    const label = payload.title?.trim()
    if (!slug || !label) continue
    out.push({ slug, label, score: hit.score })
  }
  return out
}

export async function vectorSearchProductSkuList(
  q: string,
  options?: { limit?: number },
): Promise<string[]> {
  const hits = await vectorSearchProductSkus(q, options)
  return hits.map((h) => h.sku)
}
