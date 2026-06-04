import { QdrantClient } from "@qdrant/js-client-rest";

function getClient() {
  const url = process.env.QDRANT_URL || "http://localhost:6333";
  const apiKey = process.env.QDRANT_API_KEY;

  return new QdrantClient({
    url,
    apiKey: apiKey || undefined,
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
