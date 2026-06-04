import { mediaUrl } from './media-url.js'
import type { CatalogImageFields } from './types.js'

/** ownImage > providerImageUrl > null (RF-024 display) */
export function resolveCatalogImage(product: CatalogImageFields): string | null {
  const own = mediaUrl(product.ownImage ?? null)
  if (own) return own

  const provider = product.providerImageUrl?.trim()
  if (provider) return provider

  return null
}
