import type { Payload, PayloadRequest } from 'payload'

import { deletePoints, upsertPoints } from '@/lib/qdrant'
import type { SearchEntityType } from '@/lib/supabase-server'
import { resolveDisplayImage } from '@/utilities/resolveDisplayImage'

import { embedDocumentText } from './embedding'
import { buildIndexText } from './indexText'
import {
  mapQdrantPayload,
  qdrantCollectionForEntity,
} from './payloadMappers'
import {
  claimSearchEvents,
  completeSearchEvent,
  eventPayload,
  failSearchEvent,
} from './searchEvents'
import type { SearchEventPayload, SearchEventRow, SearchIndexerBatchResult } from './types'

const ERP_FIELDS = ['skuErp', 'mainWholesaleRef', 'oemRef', 'ean'] as const

type RunSearchIndexerBatchInput = {
  payload: Payload
  req?: PayloadRequest
  batchSize?: number
  logger?: Payload['logger']
}

function normalizeKeywords(value: unknown): string | null | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'object' && item && 'keyword' in item) {
          return String((item as { keyword: string }).keyword)
        }
        return String(item)
      })
      .filter(Boolean)
      .join(' ')
  }
  return String(value)
}

function isProductPayloadIncomplete(doc: SearchEventPayload): boolean {
  return ERP_FIELDS.some((field) => doc[field] == null || doc[field] === '')
}

async function loadProductPayload(
  payload: Payload,
  req: PayloadRequest | undefined,
  payloadEntityId: string | number,
  base: SearchEventPayload,
): Promise<SearchEventPayload> {
  const product = await payload.findByID({
    collection: 'products',
    id: payloadEntityId,
    depth: 1,
    req,
    overrideAccess: true,
  })

  const categories = Array.isArray(product.categories) ? product.categories : []
  const firstCategory = categories[0]
  const categorySlug =
    typeof firstCategory === 'object' && firstCategory && 'slug' in firstCategory
      ? (firstCategory.slug as string | undefined)
      : undefined
  const categoryTitle =
    typeof firstCategory === 'object' && firstCategory && 'title' in firstCategory
      ? (firstCategory.title as string | undefined)
      : undefined

  return {
    ...base,
    title: base.title ?? product.title,
    slug: base.slug ?? product.slug,
    metaDescription: base.metaDescription ?? product.metaDescription,
    keywords: base.keywords ?? normalizeKeywords(product.keywords),
    shortDescription: base.shortDescription ?? product.shortDescription,
    skuErp: base.skuErp ?? product.skuErp,
    mainWholesaleRef: base.mainWholesaleRef ?? product.mainWholesaleRef,
    oemRef: base.oemRef ?? product.oemRef,
    ean: base.ean ?? product.ean,
    isWildcard: base.isWildcard ?? product.isWildcard,
    _status: base._status ?? product._status,
    payloadEntityId: base.payloadEntityId ?? product.id,
    categorySlug: base.categorySlug ?? categorySlug,
    categoryTitle: base.categoryTitle ?? categoryTitle,
    priceHint: base.priceHint ?? product.p1Price ?? null,
    thumbnailUrl:
      base.thumbnailUrl ??
      resolveDisplayImage({
        ownImage: product.ownImage,
        providerImageUrl: product.providerImageUrl,
      }),
  }
}

async function loadCategoryPayload(
  payload: Payload,
  req: PayloadRequest | undefined,
  payloadEntityId: string | number,
  base: SearchEventPayload,
): Promise<SearchEventPayload> {
  const category = await payload.findByID({
    collection: 'categories',
    id: payloadEntityId,
    depth: 0,
    req,
    overrideAccess: true,
  })

  return {
    ...base,
    title: base.title ?? category.title,
    slug: base.slug ?? category.slug,
    _status: base._status ?? (category as { _status?: string })._status,
    payloadEntityId: base.payloadEntityId ?? category.id,
  }
}

async function resolveEventPayload(
  event: SearchEventRow,
  entityType: SearchEntityType,
  payload: Payload,
  req: PayloadRequest | undefined,
): Promise<SearchEventPayload> {
  const base = eventPayload(event)
  const payloadEntityId = base.payloadEntityId
  if (payloadEntityId == null) {
    return base
  }

  if (entityType === 'producto' && isProductPayloadIncomplete(base)) {
    return loadProductPayload(payload, req, payloadEntityId, base)
  }

  if (entityType === 'categoria' && (base._status == null || base.title == null)) {
    return loadCategoryPayload(payload, req, payloadEntityId, base)
  }

  return base
}

function shouldSkipProductIndexing(doc: SearchEventPayload): 'wildcard' | 'unpublished' | null {
  if (doc.isWildcard === true) return 'wildcard'
  if (doc._status != null && doc._status !== 'published') return 'unpublished'
  return null
}

async function processSkippedProduct(
  event: SearchEventRow,
  skipReason: 'wildcard' | 'unpublished',
  logger: Payload['logger'],
): Promise<'skippedWildcard' | 'skippedUnpublished'> {
  await deletePoints('products', [event.entity_id]).catch(() => undefined)
  await completeSearchEvent(event.id)
  logger.info(
    { searchEventId: event.id, entityId: event.entity_id, skipReason },
    'Skipped product indexing',
  )
  return skipReason === 'wildcard' ? 'skippedWildcard' : 'skippedUnpublished'
}

async function processDeleteEvent(
  event: SearchEventRow,
  entityType: SearchEntityType,
): Promise<void> {
  const collection = qdrantCollectionForEntity(entityType)
  await deletePoints(collection, [event.entity_id])
  await completeSearchEvent(event.id)
}

async function processUpsertEvent(
  event: SearchEventRow,
  entityType: SearchEntityType,
  doc: SearchEventPayload,
  logger: Payload['logger'],
): Promise<'succeeded' | 'skippedWildcard' | 'skippedUnpublished'> {
  const collection = qdrantCollectionForEntity(entityType)
  const payloadId = doc.payloadEntityId ?? event.entity_id

  if (entityType === 'producto') {
    const skipReason = shouldSkipProductIndexing(doc)
    if (skipReason) {
      return processSkippedProduct(event, skipReason, logger)
    }
  }

  const indexText = buildIndexText(entityType, doc)
  const vector = await embedDocumentText(indexText)
  const qdrantPayload = mapQdrantPayload(entityType, doc, payloadId)

  await upsertPoints(collection, [
    {
      id: event.entity_id,
      vector,
      payload: qdrantPayload,
    },
  ])
  await completeSearchEvent(event.id)
  return 'succeeded'
}

export async function runSearchIndexerBatch(
  input: RunSearchIndexerBatchInput,
): Promise<SearchIndexerBatchResult> {
  const started = Date.now()
  const logger = input.logger ?? input.payload.logger
  const batchSize = input.batchSize ?? 50

  const events = await claimSearchEvents(batchSize)
  const result: SearchIndexerBatchResult = {
    processed: events.length,
    succeeded: 0,
    failed: 0,
    skippedWildcard: 0,
    skippedUnpublished: 0,
    durationMs: 0,
  }

  for (const event of events) {
    const entityType = event.entity_type as SearchEntityType

    try {
      if (event.action === 'delete') {
        await processDeleteEvent(event, entityType)
        result.succeeded += 1
        continue
      }

      const base = eventPayload(event)
      if (entityType === 'producto') {
        const skipReason = shouldSkipProductIndexing(base)
        if (skipReason) {
          const outcome = await processSkippedProduct(event, skipReason, logger)
          if (outcome === 'skippedWildcard') {
            result.skippedWildcard += 1
          } else {
            result.skippedUnpublished += 1
          }
          result.succeeded += 1
          continue
        }
      }

      const doc = await resolveEventPayload(event, entityType, input.payload, input.req)
      const outcome = await processUpsertEvent(event, entityType, doc, logger)

      if (outcome === 'skippedWildcard') {
        result.skippedWildcard += 1
        result.succeeded += 1
      } else if (outcome === 'skippedUnpublished') {
        result.skippedUnpublished += 1
        result.succeeded += 1
      } else {
        result.succeeded += 1
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Search indexer failed'
      logger.error({ err: error, searchEventId: event.id }, message)
      const terminal = await failSearchEvent(event, message)
      if (terminal === 'error') {
        result.failed += 1
      }
    }
  }

  result.durationMs = Date.now() - started
  return result
}
