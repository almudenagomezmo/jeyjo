import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionSlug } from 'payload'

import { enqueueSearchEvent, type SearchEntityType } from '@/lib/supabase-server'

const SEARCH_INDEXED: Partial<Record<CollectionSlug, SearchEntityType>> = {
  products: 'producto',
  categories: 'categoria',
}

export function buildSearchPayload(doc: Record<string, unknown>): Record<string, unknown> {
  return {
    title: doc.title,
    slug: doc.slug,
    metaDescription: doc.metaDescription,
    keywords: doc.keywords,
    shortDescription: doc.shortDescription,
    skuErp: doc.skuErp,
    mainWholesaleRef: doc.mainWholesaleRef,
    oemRef: doc.oemRef,
    ean: doc.ean,
    isWildcard: doc.isWildcard,
    _status: doc._status,
    payloadEntityId: doc.id,
  }
}

export function createSearchEventAfterChangeHook(
  collectionSlug: CollectionSlug,
): CollectionAfterChangeHook {
  const entityType = SEARCH_INDEXED[collectionSlug]

  return async ({ doc, operation, req }) => {
    if (!entityType || !doc?.id) return doc

    try {
      await enqueueSearchEvent({
        entityType,
        entityId: doc.id,
        action: operation === 'create' ? 'create' : 'update',
        payload: buildSearchPayload(doc as Record<string, unknown>),
      })
    } catch (error) {
      req.payload.logger.error(
        { err: error, collection: collectionSlug, id: doc.id },
        'Failed to enqueue search event',
      )
    }

    return doc
  }
}

export function createSearchEventAfterDeleteHook(
  collectionSlug: CollectionSlug,
): CollectionAfterDeleteHook {
  const entityType = SEARCH_INDEXED[collectionSlug]

  return async ({ doc, req }) => {
    if (!entityType || !doc?.id) return doc

    try {
      await enqueueSearchEvent({
        entityType,
        entityId: doc.id,
        action: 'delete',
        payload: { title: doc.title, slug: doc.slug },
      })
    } catch (error) {
      req.payload.logger.error(
        { err: error, collection: collectionSlug, id: doc.id },
        'Failed to enqueue search event on delete',
      )
    }

    return doc
  }
}

export const productSearchEventHooks = {
  afterChange: [createSearchEventAfterChangeHook('products')],
  afterDelete: [createSearchEventAfterDeleteHook('products')],
}

export const categorySearchEventHooks = {
  afterChange: [createSearchEventAfterChangeHook('categories')],
  afterDelete: [createSearchEventAfterDeleteHook('categories')],
}
