import { QdrantClient } from "@qdrant/js-client-rest";

function getClient() {
  const url = process.env.QDRANT_URL || "http://localhost:6333";
  const apiKey = process.env.QDRANT_API_KEY;

  return new QdrantClient({
    url,
    apiKey: apiKey || undefined,
    checkCompatibility: false,
  });
}

export const qdrant = getClient();

export async function ensureCollection(name: string, vectorSize: number) {
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some((c) => c.name === name);

  if (!exists) {
    await qdrant.createCollection(name, {
      vectors: { size: vectorSize, distance: "Cosine" },
    });
  }
}

export async function upsertPoints(
  collectionName: string,
  points: { id: string | number; vector: number[]; payload?: Record<string, unknown> }[],
) {
  await qdrant.upsert(collectionName, {
    wait: true,
    points: points.map((p) => ({
      id: p.id,
      vector: p.vector,
      payload: p.payload,
    })),
  });
}

export async function searchPoints(
  collectionName: string,
  vector: number[],
  options?: { limit?: number; filter?: Record<string, unknown> },
) {
  return qdrant.search(collectionName, {
    vector,
    limit: options?.limit ?? 10,
    filter: options?.filter,
  });
}

export async function deletePoints(collectionName: string, ids: (string | number)[]) {
  await qdrant.delete(collectionName, {
    wait: true,
    points: ids,
  });
}

export type QdrantScrollPoint = {
  id: string | number
  payload?: Record<string, unknown> | null
}

export async function scrollPointBatch(
  collectionName: string,
  options?: { limit?: number; offset?: string | number | Record<string, unknown> | null },
): Promise<{ points: QdrantScrollPoint[]; nextOffset: string | number | Record<string, unknown> | null }> {
  const result = await qdrant.scroll(collectionName, {
    limit: options?.limit ?? 256,
    offset: options?.offset ?? undefined,
    with_payload: true,
    with_vector: false,
  })

  return {
    points: (result.points ?? []).map((point) => ({
      id: point.id,
      payload: (point.payload ?? null) as Record<string, unknown> | null,
    })),
    nextOffset: result.next_page_offset ?? null,
  }
}

export async function getCollectionPointCount(collectionName: string): Promise<number> {
  const result = await qdrant.count(collectionName, { exact: true })
  return result.count
}
