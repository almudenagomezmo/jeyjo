import { resolveCatalogImage } from '@jeyjo/catalog-images'
import type { Payload } from 'payload'

import type { Media, Product, Supplier } from '@/payload-types'

import { formatMerchantPrice, mapStockToMerchantAvailability } from './build-xml'
import type { MerchantFeedBuildResult, MerchantFeedOmittedCounts, MerchantFeedRow } from './types'
import { buildMerchantFeedXml } from './build-xml'

const PAGE_SIZE = 500

function storefrontBaseUrl(): string {
  return (
    process.env.MERCHANT_FEED_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_STOREFRONT_URL?.trim() ||
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

function cmsBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SERVER_URL?.trim() ||
    process.env.PAYLOAD_PUBLIC_SERVER_URL?.trim() ||
    'http://localhost:3001'
  ).replace(/\/$/, '')
}

function absoluteUrl(url: string | null, base: string): string | null {
  if (!url?.trim()) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

function productDescription(doc: Product): string {
  const meta = doc.meta?.description?.trim()
  if (meta) return meta.slice(0, 5000)
  const short = doc.shortDescription?.trim()
  if (short) return short.slice(0, 5000)
  return doc.title.slice(0, 5000)
}

function resolveBrand(doc: Product): string | undefined {
  const supplier = doc.supplier
  if (supplier && typeof supplier === 'object' && 'name' in supplier) {
    const name = (supplier as Supplier).name?.trim()
    if (name) return name
  }
  return undefined
}

function resolveImageLink(doc: Product): string | null {
  const ownImage =
    doc.ownImage && typeof doc.ownImage === 'object'
      ? (doc.ownImage as Media).url ?? null
      : null

  const imageUrl = resolveCatalogImage({
    ownImage: ownImage ? { url: ownImage } : null,
    providerImageUrl: doc.providerImageUrl ?? null,
  })

  return absoluteUrl(imageUrl, cmsBaseUrl())
}

export async function fetchPublicCatalogRows(payload: Payload): Promise<{
  rows: MerchantFeedRow[]
  omitted: MerchantFeedOmittedCounts
}> {
  const rows: MerchantFeedRow[] = []
  const omitted: MerchantFeedOmittedCounts = {
    missingImage: 0,
    missingPrice: 0,
    missingSku: 0,
  }

  const storefront = storefrontBaseUrl()
  let page = 1
  let hasNext = true

  while (hasNext) {
    const result = await payload.find({
      collection: 'products',
      where: {
        and: [
          { _status: { equals: 'published' } },
          {
            or: [{ isWildcard: { equals: false } }, { isWildcard: { exists: false } }],
          },
        ],
      },
      limit: PAGE_SIZE,
      page,
      depth: 1,
      overrideAccess: true,
    })

    for (const doc of result.docs as Product[]) {
      const sku = doc.skuErp?.trim()
      const slug = doc.slug?.trim()
      if (!sku) {
        omitted.missingSku += 1
        continue
      }
      if (!slug) {
        omitted.missingSku += 1
        continue
      }

      const p1 = doc.p1Price
      const vatRate = doc.vatRate ?? 21
      if (p1 == null || p1 <= 0) {
        omitted.missingPrice += 1
        continue
      }

      const imageLink = resolveImageLink(doc)
      if (!imageLink) {
        omitted.missingImage += 1
        continue
      }

      rows.push({
        id: sku,
        title: doc.title,
        description: productDescription(doc),
        link: `${storefront}/p/${encodeURIComponent(slug)}`,
        imageLink,
        price: formatMerchantPrice(p1, vatRate),
        availability: mapStockToMerchantAvailability({
          stockIndicator: doc.stockIndicator,
          allowOrderWithoutStock: doc.allowOrderWithoutStock,
        }),
        brand: resolveBrand(doc),
        gtin: doc.ean?.trim() || undefined,
      })
    }

    hasNext = result.hasNextPage
    page += 1
  }

  return { rows, omitted }
}

export async function buildMerchantFeed(payload: Payload): Promise<MerchantFeedBuildResult> {
  const { rows, omitted } = await fetchPublicCatalogRows(payload)
  const xml = buildMerchantFeedXml(rows)
  return { rows, omitted, xml }
}
