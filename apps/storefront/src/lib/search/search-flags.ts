export function isPredictiveSearchEnabled(): boolean {
  return process.env.PREDICTIVE_SEARCH_ENABLED !== 'false'
}

export function isQdrantConfigured(): boolean {
  return Boolean(process.env.QDRANT_URL?.trim())
}
