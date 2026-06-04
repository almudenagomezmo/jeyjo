import { QdrantClient } from '@qdrant/js-client-rest'

function getClient(): QdrantClient {
  const url = process.env.QDRANT_URL || 'http://localhost:6333'
  const apiKey = process.env.QDRANT_API_KEY

  return new QdrantClient({
    url,
    apiKey: apiKey || undefined,
  })
}

let client: QdrantClient | null = null

export function getQdrantClient(): QdrantClient {
  if (!client) {
    client = getClient()
  }
  return client
}

export function resetQdrantClientForTests(): void {
  client = null
}

export type QdrantSearchHit = {
  id: string | number
  score: number
  payload?: Record<string, unknown> | null
}

export async function searchPoints(
  collectionName: string,
  vector: number[],
  options?: { limit?: number; filter?: Record<string, unknown> },
): Promise<QdrantSearchHit[]> {
  const qdrant = getQdrantClient()
  const results = await qdrant.search(collectionName, {
    vector,
    limit: options?.limit ?? 10,
    filter: options?.filter,
  })

  return results.map((r) => ({
    id: r.id,
    score: r.score,
    payload: r.payload ?? null,
  }))
}
