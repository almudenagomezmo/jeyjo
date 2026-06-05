import { serializeImportacionArticulos, type SerializeProductRow } from '@jeyjo/erp-excel'
import type { Payload, PayloadRequest } from 'payload'

import type { Product } from '@/payload-types'

const EXPORT_LIMIT = 10_000

export async function buildCatalogExportBuffer(
  payload: Payload,
  req?: PayloadRequest,
): Promise<Buffer> {
  const found = await payload.find({
    collection: 'products',
    where: {
      skuErp: { exists: true },
    },
    limit: EXPORT_LIMIT,
    depth: 1,
    overrideAccess: true,
    req,
  })

  const rows: SerializeProductRow[] = found.docs
    .filter((doc) => Boolean(doc.skuErp?.trim()))
    .map((doc) => mapProductToExportRow(doc))

  return serializeImportacionArticulos(rows)
}

function mapProductToExportRow(doc: Product): SerializeProductRow {
  const category =
    doc.categories && Array.isArray(doc.categories) && doc.categories.length > 0
      ? typeof doc.categories[0] === 'object' && doc.categories[0] !== null
        ? String((doc.categories[0] as { title?: string }).title ?? '')
        : ''
      : null

  return {
    skuErp: doc.skuErp!,
    shortDescription: doc.shortDescription ?? doc.title ?? null,
    p1Price: doc.p1Price ?? null,
    p2Price: doc.p2Price ?? null,
    vatRate: doc.vatRate ?? null,
    packUnit: doc.packUnit ?? null,
    ean: doc.ean ?? null,
    mainWholesaleRef: doc.mainWholesaleRef ?? null,
    oemRef: doc.oemRef ?? null,
    supplierErpCode:
      typeof doc.supplier === 'object' && doc.supplier !== null
        ? (doc.supplier as { erpCode?: string }).erpCode ?? null
        : null,
    erpStock: doc.erpStock ?? null,
    isWildcard: doc.isWildcard ?? false,
    categoryName: category,
    publicationStatus: doc._status ?? null,
    metaDescription: doc.metaDescription ?? doc.meta?.description ?? null,
    slug: doc.slug ?? null,
  }
}
