import type { CatalogDownloadDto, CatalogDownloadsByType } from './types'

export function groupCatalogDownloadsByType(items: CatalogDownloadDto[]): CatalogDownloadsByType {
  const grouped: CatalogDownloadsByType = {
    catalog: [],
    offer_magazine: [],
    other: [],
  }
  for (const item of items) {
    grouped[item.documentType].push(item)
  }
  return grouped
}

export const DOCUMENT_TYPE_SECTION_LABELS: Record<keyof CatalogDownloadsByType, string> = {
  catalog: 'Catálogos',
  offer_magazine: 'Revistas de ofertas',
  other: 'Otros documentos',
}
