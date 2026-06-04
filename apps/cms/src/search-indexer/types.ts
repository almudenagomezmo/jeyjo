import type { Database } from '@jeyjo/database-types'

export type SearchEventRow = Database['public']['Tables']['search_events']['Row']

export type SearchEventPayload = {
  title?: string | null
  slug?: string | null
  metaDescription?: string | null
  keywords?: string | null
  shortDescription?: string | null
  skuErp?: string | null
  mainWholesaleRef?: string | null
  oemRef?: string | null
  ean?: string | null
  isWildcard?: boolean | null
  _status?: string | null
  payloadEntityId?: string | number | null
  categorySlug?: string | null
  categoryTitle?: string | null
  priceHint?: number | null
  thumbnailUrl?: string | null
  _indexAttempts?: number
}

export type SearchIndexerBatchResult = {
  processed: number
  succeeded: number
  failed: number
  skippedWildcard: number
  skippedUnpublished: number
  durationMs: number
}

export type ProductQdrantPayload = {
  entityType: 'producto'
  payloadId: string | number
  skuErp?: string | null
  title?: string | null
  slug?: string | null
  ean?: string | null
  oemRef?: string | null
  mainWholesaleRef?: string | null
  categorySlug?: string | null
  isPublished: boolean
  thumbnailUrl?: string | null
  priceHint?: number | null
}

export type CategoryQdrantPayload = {
  entityType: 'categoria'
  payloadId: string | number
  title?: string | null
  slug?: string | null
  isPublished: boolean
}
