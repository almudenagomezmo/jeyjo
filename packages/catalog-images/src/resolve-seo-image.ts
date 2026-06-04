import { resolveCatalogImage } from './resolve-catalog-image.js'
import { mediaUrl } from './media-url.js'
import type { SeoImageFields } from './types.js'

/** metaImage > resolveCatalogImage(...) > null */
export function resolveSeoImage(product: SeoImageFields): string | null {
  const meta = mediaUrl(product.metaImage ?? null)
  if (meta) return meta

  return resolveCatalogImage(product)
}
