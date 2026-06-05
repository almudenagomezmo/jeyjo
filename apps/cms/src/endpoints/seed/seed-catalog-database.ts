import type { Payload, PayloadRequest } from 'payload'

import { seedHomeMerchandising } from './home-merchandising'
import { seedJeyjoCatalog } from './jeyjo-catalog'

const CATALOG_COLLECTIONS = ['products', 'categories', 'suppliers'] as const

/**
 * Persiste el catálogo Jeyjo en Postgres (Supabase vía Payload).
 * Las tablas `products`, `categories` y `suppliers` viven en el mismo `DATABASE_URL`
 * que `customers` y el resto del esquema Supabase.
 */
export async function clearCatalogCollections({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> {
  payload.logger.info('— Clearing catalog collections (products, categories, suppliers)...')

  for (const collection of CATALOG_COLLECTIONS) {
    await payload.db.deleteMany({ collection, req, where: {} })
    if (payload.collections[collection].config.versions) {
      await payload.db.deleteVersions({ collection, req, where: {} })
    }
  }
}

export async function seedCatalogDatabase({
  payload,
  req,
  options = {},
}: {
  payload: Payload
  req: PayloadRequest
  options?: {
    /** Si true, borra productos/categorías/proveedores antes de insertar */
    reset?: boolean
    /** ID de media para banners home; si se omite, no se crean promoBanners */
    heroMediaId?: string | number
  }
}): Promise<void> {
  const { reset = true, heroMediaId } = options

  if (reset) {
    await clearCatalogCollections({ payload, req })
  }

  // Los campos de proveedor/producto son ERP read-only; el seed actúa como sync autorizado.
  req.context = { ...req.context, erpSync: true }

  await seedJeyjoCatalog({ payload, req })

  let bannerMediaId = heroMediaId
  if (bannerMediaId == null) {
    const media = await payload.find({
      collection: 'media',
      limit: 1,
      depth: 0,
      sort: 'createdAt',
    })
    bannerMediaId = media.docs[0]?.id
  }

  if (bannerMediaId != null) {
    await seedHomeMerchandising({ payload, req, heroMediaId: bannerMediaId })
  } else {
    payload.logger.info('— Skipping home promo banners (no media in database)')
    const categories = await payload.find({
      collection: 'categories',
      where: { slug: { in: ['escritura', 'papel', 'impresion', 'archivo', 'oficina', 'reciclaje'] } },
      limit: 6,
      depth: 0,
      sort: 'sortOrder',
    })

    const products = await payload.find({
      collection: 'products',
      where: { skuErp: { in: ['10102007', '12701009', 'ERP-TNR-085', '16401136'] } },
      limit: 10,
      depth: 0,
    })

    const ids = products.docs.map((p) => p.id).filter((id): id is number => typeof id === 'number')

    await payload.updateGlobal({
      slug: 'home',
      data: {
        promoBanners: [],
        featuredCategories: categories.docs.map((c) => c.id),
        topSalesB2c: ids.slice(0, 2),
        topSalesB2b: ids.slice(2, 4),
        ecoHighlight: ids.slice(0, 1),
      },
      depth: 0,
      req,
      context: { disableRevalidate: true },
    })
  }

  payload.logger.info('— Catalog persisted to Supabase Postgres')
}
