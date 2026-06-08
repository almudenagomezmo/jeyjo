import { STOCK_INDICATOR_LABELS } from '@jeyjo/stock-ports'
import type { PriceQuote } from '@jeyjo/pricing'

import type { PublicProductDoc } from '@/lib/catalog/fetch-public-products-by-skus'
import { resolvePublicStockLevel } from '@/lib/catalog/resolve-stock-level'
import {
  COMPARE_DESCRIPTION_MAX_LENGTH,
  COMPARE_EMPTY_PLACEHOLDER,
} from '@/lib/compare/constants'
import type { CompareColumn } from '@/lib/compare/types'

function relationName(
  relation: PublicProductDoc['supplier'],
): string | null {
  if (relation && typeof relation === 'object' && 'name' in relation && relation.name) {
    return String(relation.name)
  }
  return null
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1).trim()}…`
}

function displayOrDash(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : COMPARE_EMPTY_PLACEHOLDER
}

export function formatPackUnitLabel(packUnit: number): string {
  if (packUnit <= 1) return 'Unidad'
  return `Caja de ${packUnit} uds.`
}

export function mapDocToCompareColumn(
  doc: PublicProductDoc,
  quote?: PriceQuote,
): CompareColumn | null {
  const sku = doc.skuErp?.trim()
  if (!sku) return null

  const level = resolvePublicStockLevel(doc)
  const rawDescription =
    typeof doc.shortDescription === 'string' ? stripHtml(doc.shortDescription) : ''
  const description = rawDescription
    ? truncate(rawDescription, COMPARE_DESCRIPTION_MAX_LENGTH)
    : COMPARE_EMPTY_PLACEHOLDER

  const brand =
    typeof doc.brand === 'string'
      ? displayOrDash(doc.brand)
      : COMPARE_EMPTY_PLACEHOLDER

  return {
    sku,
    slug: doc.slug?.trim() || sku.toLowerCase(),
    title: doc.title?.trim() || sku,
    imageUrl: doc.thumbnailUrl ?? null,
    brand,
    supplier: displayOrDash(relationName(doc.supplier)),
    color: displayOrDash(doc.facetColor),
    material: displayOrDash(doc.facetMaterial),
    packUnit: doc.packUnit != null && doc.packUnit > 0 ? doc.packUnit : 1,
    vatRate: doc.vatRate ?? 21,
    description,
    quote,
    stock: {
      level,
      label: STOCK_INDICATOR_LABELS[level],
      isStale: false,
      allowOrderWithoutStock: doc.allowOrderWithoutStock === true,
    },
  }
}
