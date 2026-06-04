import { env, pipeline } from '@xenova/transformers'

import { qdrantCollections } from '@/lib/qdrant-collections'

const MODEL_ID = 'Xenova/multilingual-e5-small'

export const EMBEDDING_DIMENSION =
  qdrantCollections.find((c) => c.name === 'products')?.vectorSize ?? 384

type FeatureExtractor = Awaited<ReturnType<typeof pipeline<'feature-extraction'>>>

let extractorPromise: Promise<FeatureExtractor> | null = null

function configureTransformersEnv(): void {
  env.allowLocalModels = false
  env.useBrowserCache = false
}

export function resetEmbeddingSingletonForTests(): void {
  extractorPromise = null
}

async function getExtractor(): Promise<FeatureExtractor> {
  if (!extractorPromise) {
    configureTransformersEnv()
    extractorPromise = pipeline('feature-extraction', MODEL_ID)
  }
  return extractorPromise
}

export async function embedDocumentText(text: string): Promise<number[]> {
  const normalized = text.trim()
  if (!normalized) {
    throw new Error('Cannot embed empty document text')
  }

  const extractor = await getExtractor()
  const output = await extractor(normalized, { pooling: 'mean', normalize: true })
  const vector = Array.from(output.data as Float32Array | number[])

  if (vector.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `Expected embedding dimension ${EMBEDDING_DIMENSION}, got ${vector.length}`,
    )
  }

  return vector
}
