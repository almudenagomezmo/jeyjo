import { resolveStockIndicator } from '@jeyjo/stock-ports'
import type { Payload, PayloadRequest } from 'payload'

import {
  JEYJO_ERP_STUB_PRODUCTS,
  JEYJO_PRODUCTS,
  JEYJO_REF_FIXTURES,
  JEYJO_SUPPLIERS,
  b2bPrice,
  priceWithoutVat,
  type JeyjoProductSeed,
} from './jeyjo-es-catalog-data'
import { seedStorefrontNavigationCategories } from './storefront-navigation'

async function resolveCategoryId(
  payload: Payload,
  slug: string,
): Promise<string | number> {
  const result = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })

  const doc = result.docs[0]
  if (!doc) {
    throw new Error(`Category "${slug}" not found — run storefront navigation seed first`)
  }

  return doc.id
}

function buildKeywords(keywords?: string[]) {
  return keywords?.map((keyword) => ({ keyword })) ?? []
}

function buildProductData(
  product: JeyjoProductSeed,
  supplierId: string | number,
  categoryId: string | number,
) {
  const vatRate = product.vatRate ?? 21
  const p1Price = priceWithoutVat(product.priceWithVat, vatRate)
  const p2Price = b2bPrice(p1Price)
  const stockIndicator = resolveStockIndicator({
    erpStock: product.erpStock,
    distrisantiagoStock: null,
    arnoiaStock: null,
  }).level

  return {
    title: product.title,
    slug: product.slug,
    _status: 'published' as const,
    supplier: supplierId,
    categories: [categoryId],
    skuErp: product.skuErp,
    ...(product.mainWholesaleRef ? { mainWholesaleRef: product.mainWholesaleRef } : {}),
    ...(product.oemRef ? { oemRef: product.oemRef } : {}),
    ...(product.ean ? { ean: product.ean } : {}),
    shortDescription: product.shortDescription,
    p1Price,
    p2Price,
    vatRate,
    packUnit: 1,
    erpStock: product.erpStock,
    stockIndicator,
    syncErpAt: new Date().toISOString(),
    meta: {
      description: `${product.title} — compra online en Jeyjo al mejor precio.`.slice(0, 160),
    },
    keywords: buildKeywords(product.keywords),
    ...(product.facetColor ? { facetColor: product.facetColor } : {}),
    ...(product.facetMaterial ? { facetMaterial: product.facetMaterial } : {}),
    ecoLabel: product.ecoLabel ?? false,
    enableVariants: false,
    priceInUSDEnabled: false,
  }
}

export async function seedJeyjoCatalog({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> {
  payload.logger.info('— Seeding Jeyjo catalog (suppliers, categories, products from jeyjo.es)...')

  await seedStorefrontNavigationCategories({ payload, req })

  const supplierIds = new Map<string, string | number>()

  for (const supplier of JEYJO_SUPPLIERS) {
    const created = await payload.create({
      collection: 'suppliers',
      data: {
        name: supplier.name,
        erpCode: supplier.erpCode,
        type: supplier.type,
        ...(supplier.baseImageUrl ? { baseImageUrl: supplier.baseImageUrl } : {}),
      },
      req,
    })
    supplierIds.set(supplier.erpCode, created.id)
  }

  const categoryIds = new Map<string, string | number>()
  const uniqueCategorySlugs = [
    ...new Set([
      ...JEYJO_PRODUCTS.map((p) => p.categorySlug),
      ...JEYJO_ERP_STUB_PRODUCTS.map((p) => p.categorySlug),
      ...JEYJO_REF_FIXTURES.map((p) => p.categorySlug),
    ]),
  ]

  for (const slug of uniqueCategorySlugs) {
    categoryIds.set(slug, await resolveCategoryId(payload, slug))
  }

  const allProducts = [...JEYJO_PRODUCTS, ...JEYJO_ERP_STUB_PRODUCTS, ...JEYJO_REF_FIXTURES]
  const createdBySku = new Map<string, string | number>()

  for (const product of allProducts) {
    const supplierId = supplierIds.get(product.supplierErpCode)
    const categoryId = categoryIds.get(product.categorySlug)

    if (!supplierId || !categoryId) {
      throw new Error(
        `Missing supplier or category for product ${product.skuErp} (${product.supplierErpCode} / ${product.categorySlug})`,
      )
    }

    const created = await payload.create({
      collection: 'products',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: buildProductData(product, supplierId, categoryId) as any,
      req,
    })

    createdBySku.set(product.skuErp, created.id)
  }

  const printerId = createdBySku.get('ERP-PRT-M404')
  const tonerId = createdBySku.get('ERP-TNR-085')

  if (printerId != null && tonerId != null) {
    await payload.update({
      collection: 'products',
      id: printerId,
      data: {
        relatedProducts: [tonerId],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      req,
    })
  }

  payload.logger.info(
    `— Jeyjo catalog seed complete (${JEYJO_SUPPLIERS.length} suppliers, ${allProducts.length} products)`,
  )
}
