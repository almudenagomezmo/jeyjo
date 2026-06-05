import { absoluteMediaUrlOrNull } from '@/lib/catalog/absolute-media-url'

import type { CatalogDownloadDto, CatalogDownloadDocumentType } from './types'

type MediaLike = { url?: string | null; mimeType?: string | null; filesize?: number | null }

type PayloadCatalogDownloadDoc = {
  id: number | string
  title?: string | null
  description?: string | null
  documentType?: string | null
  validFrom?: string | null
  validUntil?: string | null
  file?: number | string | MediaLike | null
  coverImage?: number | string | MediaLike | null
}

function mediaUrl(value: number | string | MediaLike | null | undefined): string | null {
  if (!value || typeof value === 'number' || typeof value === 'string') return null
  if (typeof value.url === 'string' && value.url.trim()) return value.url.trim()
  return null
}

function asDocumentType(value: string | null | undefined): CatalogDownloadDocumentType {
  if (value === 'catalog' || value === 'offer_magazine' || value === 'other') return value
  return 'other'
}

export function mapCatalogDownloadDoc(doc: PayloadCatalogDownloadDoc): CatalogDownloadDto | null {
  const downloadRaw = mediaUrl(doc.file)
  const validFrom = doc.validFrom?.trim()
  const validUntil = doc.validUntil?.trim()
  const title = doc.title?.trim()

  if (!downloadRaw || !validFrom || !validUntil || !title) return null

  return {
    id: doc.id,
    title,
    description: doc.description?.trim() || null,
    documentType: asDocumentType(doc.documentType),
    validFrom,
    validUntil,
    downloadUrl: absoluteMediaUrlOrNull(downloadRaw) ?? downloadRaw,
    coverImageUrl: absoluteMediaUrlOrNull(mediaUrl(doc.coverImage)),
  }
}
