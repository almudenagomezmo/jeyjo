type MediaRef = {
  url?: string | null
} | number | null

type ProductImageFields = {
  ownImage?: MediaRef
  providerImageUrl?: string | null
}

function mediaUrl(media: MediaRef): string | null {
  if (media == null) return null
  if (typeof media === 'number') return null
  return media.url ?? null
}

/** ownImage > providerImageUrl > null (RF-024) */
export function resolveDisplayImage(product: ProductImageFields): string | null {
  const own = mediaUrl(product.ownImage ?? null)
  if (own) return own

  const provider = product.providerImageUrl?.trim()
  if (provider) return provider

  return null
}
