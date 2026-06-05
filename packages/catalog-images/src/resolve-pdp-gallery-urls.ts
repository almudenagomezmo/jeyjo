import { resolveCatalogImage } from './resolve-catalog-image.js'
import { mediaUrl } from './media-url.js'
import type { PdpGalleryFields } from './types.js'

function normalizeUrl(url: string): string {
  return url.trim()
}

/** Catalog primary + additionalImages, deduplicated, CMS order preserved. */
export function resolvePdpGalleryUrls(product: PdpGalleryFields): string[] {
  const primary = resolveCatalogImage(product)
  const extras: string[] = []

  for (const entry of product.additionalImages ?? []) {
    const url = mediaUrl(entry?.image ?? null)
    if (url) extras.push(url)
  }

  const seen = new Set<string>()
  const out: string[] = []

  const add = (url: string | null) => {
    if (!url) return
    const key = normalizeUrl(url)
    if (!key || seen.has(key)) return
    seen.add(key)
    out.push(key)
  }

  add(primary)
  for (const url of extras) add(url)

  return out
}
