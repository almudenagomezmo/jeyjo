import { APIError, type Endpoint } from 'payload'

import { resolveCatalogImage } from '@jeyjo/catalog-images'

import { staffReadAccess } from '@/access/staffAccess'

const SCAN_LIMIT = 500

type HealthProduct = {
  id: string | number
  title: string
  slug: string | null
  skuErp: string | null
  adminUrl: string
}

type PimHealthResponse = {
  scanned: number
  noCatalogImage: { count: number; items: HealthProduct[] }
  noMetaDescription: { count: number; items: HealthProduct[] }
  duplicateSlugs: { count: number; groups: Array<{ slug: string; items: HealthProduct[] }> }
}

function adminProductUrl(id: string | number): string {
  return `/admin/collections/products/${id}`
}

function toHealthItem(doc: {
  id: string | number
  title?: string | null
  slug?: string | null
  skuErp?: string | null
}): HealthProduct {
  return {
    id: doc.id,
    title: String(doc.title ?? doc.skuErp ?? doc.id),
    slug: doc.slug?.trim() || null,
    skuErp: doc.skuErp?.trim() || null,
    adminUrl: adminProductUrl(doc.id),
  }
}

function metaDescriptionEmpty(doc: {
  metaDescription?: string | null
  meta?: { description?: string | null } | null
}): boolean {
  return !doc.metaDescription?.trim() && !doc.meta?.description?.trim()
}

export const pimHealthEndpoint: Endpoint = {
  path: '/pim-health',
  method: 'get',
  handler: async (req) => {
    const allowed = await staffReadAccess('products')({ req })
    if (!allowed) {
      if (!req.user) throw new APIError('Unauthorized', 401)
      throw new APIError('Forbidden', 403)
    }

    const found = await req.payload.find({
      collection: 'products',
      where: { _status: { equals: 'published' } },
      limit: SCAN_LIMIT,
      depth: 1,
      req,
      overrideAccess: true,
    })

    const noCatalogImage: HealthProduct[] = []
    const noMetaDescription: HealthProduct[] = []
    const slugMap = new Map<string, HealthProduct[]>()

    for (const doc of found.docs) {
      const item = toHealthItem(doc)
      const catalogUrl = resolveCatalogImage({
        ownImage: doc.ownImage,
        providerImageUrl: doc.providerImageUrl,
      })
      if (!catalogUrl) noCatalogImage.push(item)
      if (metaDescriptionEmpty(doc)) noMetaDescription.push(item)

      const slug = doc.slug?.trim()
      if (slug) {
        const group = slugMap.get(slug) ?? []
        group.push(item)
        slugMap.set(slug, group)
      }
    }

    const duplicateGroups = [...slugMap.entries()]
      .filter(([, items]) => items.length > 1)
      .map(([slug, items]) => ({ slug, items }))

    const response: PimHealthResponse = {
      scanned: found.docs.length,
      noCatalogImage: { count: noCatalogImage.length, items: noCatalogImage.slice(0, 50) },
      noMetaDescription: { count: noMetaDescription.length, items: noMetaDescription.slice(0, 50) },
      duplicateSlugs: {
        count: duplicateGroups.length,
        groups: duplicateGroups.slice(0, 20),
      },
    }

    return Response.json(response)
  },
}
