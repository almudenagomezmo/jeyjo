import { resolveCatalogImage, resolvePdpGalleryUrls, resolveSeoImage } from '@jeyjo/catalog-images'
import { unstable_cache } from 'next/cache'

import { absoluteMediaUrl, absoluteMediaUrlOrNull, cmsBaseUrl } from '@/lib/catalog/absolute-media-url'
import { lexicalToSanitizedHtml } from '@/lib/cms/lexical-to-html'
import {
  isPublicCatalogProduct,
  type CmsProductSnapshot,
} from '@/lib/catalog/public-product-filter'
import {
  listPublicProductsByIds,
  mapDocToRow,
  type CmsProductListDoc,
} from '@/lib/catalog/fetch-product-list'
import type { PdpAttachment, PdpProductView, PdpSpecRow } from '@/lib/pdp/types'
import { PDP_RELATED_LIMIT } from '@/lib/pdp/types'
import type { PlpProductRow } from '@/lib/plp/types'
import type { GlyphKind } from '@/lib/types'

type CmsMediaRef = {
  url?: string | null
  filename?: string | null
}

export type CmsPdpProductDoc = CmsProductSnapshot &
  CmsProductListDoc & {
    id?: string | number | null
    title?: string | null
    slug?: string | null
    oemRef?: string | null
    ean?: string | null
    longDescription?: unknown
    metaDescription?: string | null
    providerImageUrl?: string | null
    ownImage?: CmsMediaRef | string | number | null
    additionalImages?:
      | Array<{
          image?: CmsMediaRef | string | number | null
        }>
      | null
    attachments?: Array<{
      label?: string | null
      file?: CmsMediaRef | string | number | null
    }> | null
    relatedProducts?: Array<CmsPdpProductDoc | string | number> | null
    categories?: Array<{ name?: string | null; slug?: string | null } | string | number> | null
    meta?: {
      title?: string | null
      description?: string | null
      image?: CmsMediaRef | string | number | null
    } | null
  }

function resolveCatalogImageUrl(doc: CmsPdpProductDoc): string | null {
  const raw = resolveCatalogImage({
    ownImage: doc.ownImage,
    providerImageUrl: doc.providerImageUrl,
  })
  return absoluteMediaUrlOrNull(raw)
}

function resolvePdpGalleryAbsoluteUrls(doc: CmsPdpProductDoc): string[] {
  const raw = resolvePdpGalleryUrls({
    ownImage: doc.ownImage,
    providerImageUrl: doc.providerImageUrl,
    additionalImages: doc.additionalImages,
  })
  return raw
    .map((url) => absoluteMediaUrlOrNull(url))
    .filter((url): url is string => Boolean(url))
}

function primaryCategoryName(categories: CmsPdpProductDoc['categories']): string {
  if (!categories?.length) return ''
  const first = categories[0]
  if (first && typeof first === 'object' && 'name' in first && first.name) {
    return String(first.name)
  }
  return ''
}

function mapAttachments(doc: CmsPdpProductDoc): PdpAttachment[] {
  const items = doc.attachments ?? []
  const out: PdpAttachment[] = []
  for (const item of items) {
    const label = item.label?.trim()
    const file = item.file
    if (!label) continue
    if (file && typeof file === 'object' && file.url) {
      out.push({ label, url: absoluteMediaUrl(String(file.url)) })
    }
  }
  return out
}

function inferGlyph(doc: CmsPdpProductDoc): GlyphKind {
  const title = (doc.title ?? '').toLowerCase()
  if (title.includes('toner') || title.includes('tóner')) return 'toner'
  if (title.includes('impresora') || title.includes('printer')) return 'printer'
  if (title.includes('grifo') || title.includes('fontaner')) return 'box'
  return 'box'
}

/** Populated CMS relations may omit `_status` (defaultPopulate); trust CMS read access. */
function isPublicRelatedProduct(doc: CmsProductSnapshot): boolean {
  if (doc.isWildcard === true) return false
  if (doc._status === 'draft') return false
  return true
}

export function extractRelatedProductIds(
  related: CmsPdpProductDoc['relatedProducts'],
): string[] {
  if (!related?.length) return []
  const ids: string[] = []
  for (const item of related) {
    if (item == null) continue
    if (typeof item === 'object' && 'id' in item && item.id != null) {
      ids.push(String(item.id))
    } else if (typeof item === 'number' || typeof item === 'string') {
      ids.push(String(item))
    }
  }
  return ids
}

/** Forward CMS order first, then products that link back to this one. */
export function mergeBidirectionalRelatedIds(
  forwardIds: string[],
  reverseIds: string[],
  selfId?: string | number | null,
): string[] {
  const self = selfId != null ? String(selfId) : null
  const seen = new Set<string>()
  const merged: string[] = []

  for (const raw of [...forwardIds, ...reverseIds]) {
    const id = raw.trim()
    if (!id || id === self || seen.has(id)) continue
    seen.add(id)
    merged.push(id)
    if (merged.length >= PDP_RELATED_LIMIT) break
  }

  return merged
}

async function fetchProductsLinkingToIdRaw(productId: string): Promise<string[]> {
  const base = cmsBaseUrl()
  if (!base || !productId.trim()) return []

  const params = new URLSearchParams({
    limit: String(PDP_RELATED_LIMIT),
    depth: '0',
    'where[_status][equals]': 'published',
    'where[relatedProducts][contains]': productId.trim(),
  })

  const res = await fetch(`${base.replace(/\/$/, '')}/api/products?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 60 },
  })
  if (!res.ok) return []

  const body = (await res.json()) as { docs?: Array<{ id?: string | number }> }
  const ids: string[] = []
  for (const doc of body.docs ?? []) {
    if (doc.id == null) continue
    ids.push(String(doc.id))
  }
  return ids
}

const cachedProductsLinkingToId = unstable_cache(
  async (productId: string) => fetchProductsLinkingToIdRaw(productId),
  ['cms-products-linking-to'],
  { revalidate: 60 },
)

export async function fetchProductsLinkingToId(productId: string): Promise<string[]> {
  return cachedProductsLinkingToId(productId)
}

export function mapRelatedDocsToRows(
  related: CmsPdpProductDoc['relatedProducts'],
): PlpProductRow[] {
  if (!related?.length) return []
  const rows: PlpProductRow[] = []
  for (const item of related) {
    if (!item || typeof item !== 'object') continue
    const doc = item as CmsPdpProductDoc
    if (!isPublicRelatedProduct(doc)) continue
    const row = mapDocToRow(doc)
    if (row) rows.push(row)
    if (rows.length >= PDP_RELATED_LIMIT) break
  }
  return rows
}

/** Resolves related products with full PLP row data (supplier, stock, image). */
export async function resolveRelatedProductRows(
  related: CmsPdpProductDoc['relatedProducts'],
  options?: { productId?: string | number | null },
): Promise<PlpProductRow[]> {
  const forwardIds = extractRelatedProductIds(related)
  const selfId = options?.productId
  const reverseIds = selfId != null ? await fetchProductsLinkingToId(String(selfId)) : []
  const ids = mergeBidirectionalRelatedIds(forwardIds, reverseIds, selfId)

  if (ids.length > 0) {
    return listPublicProductsByIds(ids)
  }
  return mapRelatedDocsToRows(related)
}

export function mapPdpDocToView(doc: CmsPdpProductDoc): PdpProductView | null {
  const sku = doc.skuErp?.trim()
  const slug = doc.slug?.trim()
  if (!sku || !slug) return null

  const packUnit = doc.packUnit != null && doc.packUnit > 0 ? doc.packUnit : 1
  const specRows: PdpSpecRow[] = [
    ['Marca', mapDocToRow(doc)?.brand ?? '—'],
    ['Referencia Jeyjo', sku],
    ['Referencia fabricante (OEM)', doc.oemRef?.trim() || '—'],
    ['Código EAN', doc.ean?.trim() || '—'],
    ['Envase de venta', `${packUnit} ${packUnit === 1 ? 'unidad' : 'unidades'}`],
    ['IVA aplicable', `${doc.vatRate ?? 21}%`],
    ['Categoría', primaryCategoryName(doc.categories) || '—'],
  ]

  return {
    sku,
    slug,
    title: doc.title?.trim() || sku,
    brand: mapDocToRow(doc)?.brand ?? 'Sin marca',
    oem: doc.oemRef?.trim() || null,
    ean: doc.ean?.trim() || null,
    packUnit,
    vatRate: doc.vatRate ?? 21,
    ecoLabel: doc.ecoLabel === true,
    categoryName: primaryCategoryName(doc.categories),
    categorySlugs: mapDocToRow(doc)?.categorySlugs ?? [],
    imageUrl: resolveCatalogImageUrl(doc),
    galleryUrls: resolvePdpGalleryAbsoluteUrls(doc),
    metaTitle: doc.meta?.title?.trim() || null,
    seoImageUrl: absoluteMediaUrlOrNull(
      resolveSeoImage({
        metaImage: doc.meta?.image,
        ownImage: doc.ownImage,
        providerImageUrl: doc.providerImageUrl,
      }),
    ),
    longDescriptionHtml: doc.longDescription
      ? lexicalToSanitizedHtml(doc.longDescription)
      : null,
    metaDescription: doc.metaDescription?.trim() || doc.meta?.description?.trim() || null,
    specRows,
    attachments: mapAttachments(doc),
    glyph: inferGlyph(doc),
    rating: null,
    reviews: null,
  }
}

async function fetchDocBySlug(slug: string): Promise<CmsPdpProductDoc | null> {
  const base = cmsBaseUrl()
  if (!base) return null

  const params = new URLSearchParams({
    'where[slug][equals]': slug,
    limit: '1',
    depth: '2',
    'where[_status][equals]': 'published',
  })

  const res = await fetch(`${base.replace(/\/$/, '')}/api/products?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 60 },
  })
  if (!res.ok) return null
  const body = (await res.json()) as { docs?: CmsPdpProductDoc[] }
  return body.docs?.[0] ?? null
}

async function fetchDocBySku(sku: string): Promise<CmsPdpProductDoc | null> {
  const base = cmsBaseUrl()
  if (!base) return null

  const params = new URLSearchParams({
    'where[skuErp][equals]': sku,
    limit: '1',
    depth: '2',
    'where[_status][equals]': 'published',
  })

  const res = await fetch(`${base.replace(/\/$/, '')}/api/products?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 60 },
  })
  if (!res.ok) return null
  const body = (await res.json()) as { docs?: CmsPdpProductDoc[] }
  return body.docs?.[0] ?? null
}

const cachedBySlug = unstable_cache(
  async (slug: string) => fetchDocBySlug(slug),
  ['cms-product-pdp-by-slug'],
  { revalidate: 60 },
)

const cachedBySku = unstable_cache(
  async (sku: string) => fetchDocBySku(sku),
  ['cms-product-pdp-by-sku'],
  { revalidate: 60 },
)

export async function fetchPublicProductPdpBySlug(
  slugOrSku: string,
): Promise<{ doc: CmsPdpProductDoc; matchedBySku: boolean } | null> {
  const key = slugOrSku.trim()
  if (!key) return null

  let doc = await cachedBySlug(key)
  let matchedBySku = false

  if (!doc) {
    doc = await cachedBySku(key)
    matchedBySku = Boolean(doc)
  }

  if (!doc || !isPublicCatalogProduct(doc)) return null
  return { doc, matchedBySku }
}

export async function listPublishedProductSlugs(limit = 500): Promise<string[]> {
  const base = cmsBaseUrl()
  if (!base) return []

  const params = new URLSearchParams({
    limit: String(limit),
    depth: '0',
    'where[_status][equals]': 'published',
  })

  const res = await fetch(`${base.replace(/\/$/, '')}/api/products?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 120 },
  })
  if (!res.ok) return []

  const body = (await res.json()) as { docs?: CmsPdpProductDoc[] }
  const slugs: string[] = []
  for (const doc of body.docs ?? []) {
    if (!isPublicCatalogProduct(doc)) continue
    const slug = doc.slug?.trim()
    if (slug) slugs.push(slug)
  }
  return slugs
}
