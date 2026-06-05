export type CatalogDownloadDocumentType = 'catalog' | 'offer_magazine' | 'other'

export type CatalogDownloadDto = {
  id: number | string
  title: string
  description: string | null
  documentType: CatalogDownloadDocumentType
  validFrom: string
  validUntil: string
  downloadUrl: string
  coverImageUrl: string | null
}

export type CatalogDownloadsByType = {
  catalog: CatalogDownloadDto[]
  offer_magazine: CatalogDownloadDto[]
  other: CatalogDownloadDto[]
}
