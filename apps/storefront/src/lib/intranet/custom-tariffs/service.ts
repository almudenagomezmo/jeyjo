import { createStubPricingReader, type ErpGroupOfferDto, type ErpSpecialPriceDto } from '@jeyjo/erp-ports'

import { fetchPublicProductsBySkus } from '@/lib/catalog/fetch-public-products-by-skus'
import { isWebNativeModeEnabled } from '@/lib/system-config/fetch'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { filterNonWildcardLines } from '@/lib/intranet/purchase-history/wildcard'

import { mapSpecialPriceRow } from './map-line'
import { resolveTariffValidity } from './validity'
import type {
  CustomTariffsFilters,
  CustomTariffsPageResult,
  GroupOfferView,
} from './types'

const DEFAULT_PAGE_SIZE = 25

async function loadCustomerMeta(customerId: string): Promise<{
  erpCode: string | null
  customerGroup: number
}> {
  const admin = getSupabaseAdminClient()
  if (!admin) return { erpCode: null, customerGroup: 2 }
  const { data } = await admin
    .from('customers')
    .select('erp_code, customer_group')
    .eq('id', customerId)
    .maybeSingle()
  return {
    erpCode: data?.erp_code?.trim() ?? null,
    customerGroup: data?.customer_group ?? 2,
  }
}

function filterBySku<T extends { sku: string }>(rows: T[], sku?: string): T[] {
  const needle = sku?.trim().toLowerCase()
  if (!needle) return rows
  return rows.filter((r) => r.sku.toLowerCase().includes(needle))
}

function isGroupOfferActive(offer: ErpGroupOfferDto, customerGroup: number): boolean {
  if (!offer.active) return false
  const { status } = resolveTariffValidity(offer.validTo)
  if (status === 'expired') return false
  if (offer.customerGroup == null) return true
  return offer.customerGroup === customerGroup
}

async function loadSpecialPricesFromSupabase(
  customerId: string,
  erpCode: string | null,
): Promise<ErpSpecialPriceDto[]> {
  const admin = getSupabaseAdminClient()
  if (!admin) return []

  const { data } = await admin
    .from('special_prices')
    .select('product_sku, net_price, valid_from, valid_to')
    .eq('customer_id', customerId)

  return (data ?? []).map((row) => ({
    customerErpCode: erpCode ?? customerId,
    skuErp: row.product_sku,
    netPrice: Number(row.net_price),
    validFrom: row.valid_from,
    validTo: row.valid_to,
  }))
}

async function loadGroupOffersFromSupabase(
  customerGroup: number,
): Promise<ErpGroupOfferDto[]> {
  const admin = getSupabaseAdminClient()
  if (!admin) return []

  const { data } = await admin
    .from('group_offers')
    .select('sku_erp, offer_net_price, customer_group, valid_from, valid_to, active')
    .eq('active', true)

  return (data ?? [])
    .filter((row) => {
      if (row.customer_group == null) return true
      return row.customer_group === customerGroup
    })
    .map((row) => ({
      skuErp: row.sku_erp,
      offerNetPrice: Number(row.offer_net_price),
      customerGroup: row.customer_group ?? undefined,
      validFrom: row.valid_from,
      validTo: row.valid_to,
      active: row.active,
    }))
}

export async function loadSpecialPricesForCustomer(
  erpCode: string,
  customerId?: string,
): Promise<ErpSpecialPriceDto[]> {
  if (await isWebNativeModeEnabled()) {
    if (!customerId) return []
    return loadSpecialPricesFromSupabase(customerId, erpCode)
  }
  const reader = createStubPricingReader()
  const page = await reader.listSpecialPrices(erpCode, { limit: 500 })
  return page.items
}

export async function loadGroupOffersForCustomer(
  customerGroup: number,
): Promise<ErpGroupOfferDto[]> {
  if (await isWebNativeModeEnabled()) {
    const offers = await loadGroupOffersFromSupabase(customerGroup)
    return offers.filter((o) => isGroupOfferActive(o, customerGroup))
  }
  const reader = createStubPricingReader()
  const page = await reader.listGroupOffers({ limit: 500 })
  return page.items.filter((o) => isGroupOfferActive(o, customerGroup))
}

export async function buildCustomTariffsPage(
  customerId: string,
  filters: CustomTariffsFilters,
): Promise<CustomTariffsPageResult> {
  const { erpCode, customerGroup } = await loadCustomerMeta(customerId)
  const erpRows =
    erpCode || (await isWebNativeModeEnabled())
      ? await loadSpecialPricesForCustomer(erpCode ?? '', customerId)
      : []
  const allowedSkus = new Set(
    filterNonWildcardLines(erpRows.map((r) => ({ sku: r.skuErp }))).map((x) => x.sku),
  )
  const wildcardFiltered = erpRows.filter((r) => allowedSkus.has(r.skuErp))
  const skuFiltered = filterBySku(
    wildcardFiltered.map((r) => ({ sku: r.skuErp, row: r })),
    filters.sku,
  ).map((x) => x.row)

  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE))
  const total = skuFiltered.length
  const slice = skuFiltered.slice((page - 1) * pageSize, page * pageSize)

  const allSkus = [
    ...new Set([
      ...slice.map((r) => r.skuErp),
      ...(await loadGroupOffersForCustomer(customerGroup)).map((o) => o.skuErp),
    ]),
  ]
  const products = await fetchPublicProductsBySkus(allSkus)
  const productBySku = new Map(products.map((p) => [p.skuErp?.trim() ?? '', p]))

  const specialPrices = slice.map((row) =>
    mapSpecialPriceRow(row, productBySku.get(row.skuErp)),
  )

  const groupOffers: GroupOfferView[] = (
    await loadGroupOffersForCustomer(customerGroup)
  ).map((offer) => {
    const product = productBySku.get(offer.skuErp)
    return {
      sku: offer.skuErp,
      productSlug: product?.slug?.trim() ?? null,
      name: product?.title ?? offer.skuErp,
      imageUrl: product?.thumbnailUrl ?? null,
      offerNetPrice: offer.offerNetPrice,
      validTo: offer.validTo?.trim() ?? null,
    }
  })

  return {
    specialPrices,
    groupOffers,
    total,
    page,
    pageSize,
  }
}

export async function findExpiredSpecialPrice(
  customerId: string,
  sku: string,
): Promise<ErpSpecialPriceDto | null> {
  const { erpCode } = await loadCustomerMeta(customerId)
  if (!erpCode) return null
  const rows = await loadSpecialPricesForCustomer(erpCode, customerId)
  const row = rows.find((r) => r.skuErp === sku.trim())
  if (!row) return null
  const { status } = resolveTariffValidity(row.validTo)
  return status === 'expired' ? row : null
}

export const PRICE_REVIEW_NOTE_PREFIX = 'Renovación precio especial — '

export function priceReviewObservation(sku: string): string {
  return `${PRICE_REVIEW_NOTE_PREFIX}${sku.trim()}`
}
