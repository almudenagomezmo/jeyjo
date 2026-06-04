import type { SearchEntityType } from '@/lib/supabase-server'

import type {
  CategoryQdrantPayload,
  ProductQdrantPayload,
  SearchEventPayload,
} from './types'

export function mapProductQdrantPayload(
  payload: SearchEventPayload,
  payloadId: string | number,
): ProductQdrantPayload {
  return {
    entityType: 'producto',
    payloadId,
    skuErp: payload.skuErp ?? null,
    title: payload.title ?? null,
    slug: payload.slug ?? null,
    ean: payload.ean ?? null,
    oemRef: payload.oemRef ?? null,
    mainWholesaleRef: payload.mainWholesaleRef ?? null,
    categorySlug: payload.categorySlug ?? null,
    isPublished: payload._status === 'published',
    thumbnailUrl: payload.thumbnailUrl ?? null,
    priceHint: payload.priceHint ?? null,
  }
}

export function mapCategoryQdrantPayload(
  payload: SearchEventPayload,
  payloadId: string | number,
): CategoryQdrantPayload {
  return {
    entityType: 'categoria',
    payloadId,
    title: payload.title ?? null,
    slug: payload.slug ?? null,
    isPublished: payload._status !== 'draft',
  }
}

export function mapQdrantPayload(
  entityType: SearchEntityType,
  payload: SearchEventPayload,
  payloadId: string | number,
): ProductQdrantPayload | CategoryQdrantPayload {
  if (entityType === 'categoria') {
    return mapCategoryQdrantPayload(payload, payloadId)
  }
  return mapProductQdrantPayload(payload, payloadId)
}

export function qdrantCollectionForEntity(entityType: SearchEntityType): string {
  return entityType === 'categoria' ? 'categories' : 'products'
}
