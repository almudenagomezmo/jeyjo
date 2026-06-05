import { getSearchConfig } from '@/lib/system-config/fetch'

export function isQdrantConfigured(): boolean {
  return Boolean(process.env.QDRANT_URL?.trim())
}

export async function isPredictiveSearchEnabled(): Promise<boolean> {
  if (process.env.PREDICTIVE_SEARCH_ENABLED === 'false') return false
  if (!isQdrantConfigured()) return false
  const search = await getSearchConfig()
  return search.predictiveEnabled !== false
}

export async function getSuggestLimit(): Promise<number> {
  const search = await getSearchConfig()
  return search.suggestLimit
}

export async function getMinQueryLength(): Promise<number> {
  const search = await getSearchConfig()
  return search.minQueryLength
}
