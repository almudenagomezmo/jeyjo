import { env, pipeline } from '@xenova/transformers'

export const MODEL_ID = 'Xenova/multilingual-e5-small'
export const EMBEDDING_DIMENSION = 384

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

async function embedText(text: string): Promise<number[]> {
  const normalized = text.trim()
  if (!normalized) {
    throw new Error('Cannot embed empty text')
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

/** Document text for indexing — no e5 prefix (matches CMS indexer). */
export async function embedDocumentText(text: string): Promise<number[]> {
  return embedText(text)
}

/** Query text for vector search — same normalization as indexer documents. */
export async function embedQueryText(text: string): Promise<number[]> {
  return embedText(text)
}
