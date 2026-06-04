import { searchPoints } from '@/lib/qdrant/client'
import { getCachedQueryEmbedding } from '@/lib/search/embedding-cache'
import { hydrateSuggestProducts, mapCategoryHits } from '@/lib/search/hydrate-suggest'
import type { QdrantCategoryPayload, QdrantProductPayload, SuggestResponse } from '@/lib/search/types'
import type { VectorSearchHit } from '@/lib/search/vector-search'

export type SuggestTimings = {
  embedMs: number
  qdrantMs: number
  hydrateMs: number
  totalMs: number
}

export function logSuggestTimings(q: string, timings: SuggestTimings): void {
  console.info('[search/suggest]', {
    q: q.slice(0, 32),
    suggest_latency_ms: timings.totalMs,
    ...timings,
  })
}

function mapProductHits(
  hits: Awaited<ReturnType<typeof searchPoints>>,
): VectorSearchHit[] {
  const out: VectorSearchHit[] = []
  for (const hit of hits) {
    const payload = (hit.payload ?? {}) as QdrantProductPayload
    const sku = payload.skuErp?.trim()
    if (!sku) continue
    out.push({ sku, score: hit.score, payload })
  }
  return out
}

function mapCategoryHitsRaw(
  hits: Awaited<ReturnType<typeof searchPoints>>,
): Array<{ slug: string; label: string }> {
  const out: Array<{ slug: string; label: string }> = []
  for (const hit of hits) {
    const payload = (hit.payload ?? {}) as QdrantCategoryPayload
    const slug = payload.slug?.trim()
    const label = payload.title?.trim()
    if (!slug || !label) continue
    out.push({ slug, label })
  }
  return out
}

export async function runSuggestSearch(q: string): Promise<{
  body: SuggestResponse
  timings: SuggestTimings
}> {
  const started = Date.now()

  const embedStart = Date.now()
  const vector = await getCachedQueryEmbedding(q)
  const embedMs = Date.now() - embedStart

  const qdrantStart = Date.now()
  const [productRaw, categoryRaw] = await Promise.all([
    searchPoints('products', vector, { limit: 10 }),
    searchPoints('categories', vector, { limit: 4 }),
  ])
  const qdrantMs = Date.now() - qdrantStart

  const productHits = mapProductHits(productRaw)
  const categoryHits = mapCategoryHitsRaw(categoryRaw)

  const hydrateStart = Date.now()
  const products = await hydrateSuggestProducts(productHits)
  const categories = mapCategoryHits(categoryHits)
  const hydrateMs = Date.now() - hydrateStart

  const totalMs = Date.now() - started
  const timings: SuggestTimings = { embedMs, qdrantMs, hydrateMs, totalMs }

  return {
    body: { products, categories, latencyMs: totalMs },
    timings,
  }
}
