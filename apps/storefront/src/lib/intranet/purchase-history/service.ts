import {
  createStubPurchaseHistoryReader,
  type ErpPurchaseHistoryLineDto,
} from '@jeyjo/erp-ports'

import { fetchPublicProductsBySkus } from '@/lib/catalog/fetch-public-products-by-skus'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { resolvePriceQuotesBatch } from '@/lib/pricing/resolve-batch'
import { fetchWebPurchaseHistoryLines } from '@/lib/orders/fetch-customer-orders'
import { filterNonWildcardLines } from './wildcard'
import { mergePurchaseHistoryLines } from './merge'
import type {
  PurchaseHistoryFilters,
  PurchaseHistoryLineView,
  RawPurchaseHistoryLine,
} from './types'

const DEFAULT_PAGE_SIZE = 25

async function loadErpCode(customerId: string): Promise<string | null> {
  const admin = getSupabaseAdminClient()
  if (!admin) return null
  const { data } = await admin
    .from('customers')
    .select('erp_code')
    .eq('id', customerId)
    .maybeSingle()
  return data?.erp_code?.trim() ?? null
}

async function loadErpLines(
  erpCode: string,
  filters: PurchaseHistoryFilters,
): Promise<RawPurchaseHistoryLine[]> {
  const reader = createStubPurchaseHistoryReader()
  const rows = await reader.listLines(erpCode, {
    from: filters.from,
    to: filters.to,
    sku: filters.sku,
    department: filters.department,
    limit: 500,
  })
  return rows.map((r: ErpPurchaseHistoryLineDto) => ({
    sku: r.sku,
    quantity: r.quantity,
    purchasedAt: r.purchasedAt,
    historicalUnitPrice: r.historicalUnitPrice,
    department: r.department ?? null,
  }))
}

function filterMergedLines(
  lines: ReturnType<typeof mergePurchaseHistoryLines>,
  filters: PurchaseHistoryFilters,
) {
  const skuNeedle = filters.sku?.trim().toLowerCase()
  const dept = filters.department?.trim()
  return lines.filter((line) => {
    if (filters.from && line.lastPurchasedAt < filters.from) return false
    if (filters.to && line.lastPurchasedAt > filters.to) return false
    if (skuNeedle && !line.sku.toLowerCase().includes(skuNeedle)) return false
    if (dept && (line.department ?? '').toLowerCase() !== dept.toLowerCase()) return false
    return true
  })
}

function categoryIdsFromProduct(
  product: Awaited<ReturnType<typeof fetchPublicProductsBySkus>>[number] | undefined,
): string[] {
  if (!product?.categories) return []
  return (product.categories ?? [])
    .map((c) => {
      if (typeof c === 'object' && c && 'id' in c) return String((c as { id?: number }).id)
      if (typeof c === 'number') return String(c)
      return null
    })
    .filter((id): id is string => Boolean(id))
}

export async function buildPurchaseHistoryPage(
  customerId: string,
  filters: PurchaseHistoryFilters,
): Promise<{
  lines: PurchaseHistoryLineView[]
  total: number
  page: number
  pageSize: number
  departments: string[]
}> {
  const erpCode = await loadErpCode(customerId)
  const erpLines = erpCode ? await loadErpLines(erpCode, filters) : []
  const webLines = await fetchWebPurchaseHistoryLines(customerId)
  const merged = filterMergedLines(
    mergePurchaseHistoryLines(filterNonWildcardLines([...erpLines, ...webLines])),
    filters,
  )

  const allSkus = merged.map((l) => l.sku)
  const products = await fetchPublicProductsBySkus(allSkus)
  const productBySku = new Map(products.map((p) => [p.skuErp?.trim() ?? '', p]))

  let working = merged
  if (filters.categoryId?.trim()) {
    const catId = filters.categoryId.trim()
    working = merged.filter((line) => {
      const product = productBySku.get(line.sku)
      const ids = categoryIdsFromProduct(product)
      return ids.includes(catId)
    })
  }

  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE))
  const total = working.length
  const slice = working.slice((page - 1) * pageSize, page * pageSize)
  const skus = slice.map((l) => l.sku)
  const quotes = await resolvePriceQuotesBatch(skus, customerId)

  const lines: PurchaseHistoryLineView[] = slice.map((line) => {
    const product = productBySku.get(line.sku)
    const slug = product?.slug?.trim() ?? null
    return {
      ...line,
      productSlug: slug,
      name: product?.title ?? line.sku,
      imageUrl: product?.thumbnailUrl ?? null,
      categoryIds: categoryIdsFromProduct(product),
      canRepeat: Boolean(slug),
      currentQuote: quotes[line.sku] ?? null,
    }
  })

  const departments = [
    ...new Set(merged.map((l) => l.department).filter((d): d is string => Boolean(d?.trim()))),
  ].sort()

  return { lines, total, page, pageSize, departments }
}
