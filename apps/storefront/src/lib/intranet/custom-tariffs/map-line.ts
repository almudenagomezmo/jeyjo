import type { ErpSpecialPriceDto } from '@jeyjo/erp-ports'

import type { PublicProductDoc } from '@/lib/catalog/fetch-public-products-by-skus'

import { resolveTariffValidity } from './validity'
import type { CustomTariffLineView } from './types'

export function deriveDiscount1Pct(
  recommended: number,
  netPrice: number,
  erpDiscount: number | null | undefined,
): { discount1Pct: number | null; derived: boolean } {
  if (erpDiscount != null && Number.isFinite(erpDiscount)) {
    return { discount1Pct: erpDiscount, derived: false }
  }
  if (recommended <= 0 || netPrice >= recommended) {
    return { discount1Pct: null, derived: false }
  }
  const pct = Math.round((1 - netPrice / recommended) * 10000) / 100
  return { discount1Pct: pct, derived: true }
}

export function mapSpecialPriceRow(
  row: ErpSpecialPriceDto,
  product: PublicProductDoc | undefined,
): CustomTariffLineView {
  const recommended =
    row.recommendedNetPrice ?? product?.p2Price ?? row.netPrice
  const { discount1Pct, derived } = deriveDiscount1Pct(
    recommended,
    row.netPrice,
    row.discount1Pct,
  )
  const { status, statusLabel } = resolveTariffValidity(row.validTo)

  return {
    sku: row.skuErp,
    productSlug: product?.slug?.trim() ?? null,
    name: product?.title ?? row.skuErp,
    imageUrl: product?.thumbnailUrl ?? null,
    minQty: row.minQty ?? null,
    recommendedNetPrice: recommended,
    discount1Pct,
    discount2Pct: row.discount2Pct ?? null,
    discountDerived: derived,
    netPrice: row.netPrice,
    validTo: row.validTo?.trim() ?? null,
    status,
    statusLabel,
    canRequestReview: status === 'expired',
  }
}
