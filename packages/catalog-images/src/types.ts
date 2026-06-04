export type MediaLike = { url?: string | null } | number | string | null

export type CatalogImageFields = {
  ownImage?: MediaLike
  providerImageUrl?: string | null
}

export type SeoImageFields = CatalogImageFields & {
  metaImage?: MediaLike
}
