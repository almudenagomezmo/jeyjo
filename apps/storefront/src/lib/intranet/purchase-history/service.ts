import {
  createStubPurchaseHistoryReader,
  type ErpPurchaseHistoryLineDto,
} from '@jeyjo/erp-ports'

import { fetchPublicProductsBySkus } from '@/lib/catalog/fetch-public-products-by-skus'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { resolvePriceQuotesBatch } from '@/lib/pricing/resolve-batch'
import { fetchWebPurchaseHistoryLines } from '@/lib/orders/fetch-customer-orders'
import { filterOrderGroups, groupRawLinesIntoOrders } from './group-orders'
import { filterNonWildcardLines } from './wildcard'
import type {
  PurchaseHistoryFilters,
  PurchaseHistoryOrderGroup,
  PurchaseHistoryOrderLineView,
  PurchaseHistoryOrderView,
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

function enrichOrderLine(
  line: PurchaseHistoryOrderGroup['lines'][number],
  productBySku: Map<string, Awaited<ReturnType<typeof fetchPublicProductsBySkus>>[number]>,
  quotes: Awaited<ReturnType<typeof resolvePriceQuotesBatch>>,
): PurchaseHistoryOrderLineView {
  const product = productBySku.get(line.sku)
  const slug = product?.slug?.trim() ?? null
  return {
    sku: line.sku,
    qty: line.qty,
    historicalUnitPrice: line.historicalUnitPrice,
    productSlug: slug,
    name: product?.title ?? line.sku,
    imageUrl: product?.thumbnailUrl ?? null,
    categoryIds: categoryIdsFromProduct(product),
    canRepeat: Boolean(slug),
    currentQuote: quotes[line.sku] ?? null,
  }
}

function filterOrdersByCategory(
  groups: PurchaseHistoryOrderGroup[],
  categoryId: string,
  productBySku: Map<string, Awaited<ReturnType<typeof fetchPublicProductsBySkus>>[number]>,
): PurchaseHistoryOrderGroup[] {
  return groups
    .map((group) => ({
      ...group,
      lines: group.lines.filter((line) => {
        const product = productBySku.get(line.sku)
        return categoryIdsFromProduct(product).includes(categoryId)
      }),
    }))
    .filter((group) => group.lines.length > 0)
}

export async function buildPurchaseHistoryPage(
  customerId: string,
  filters: PurchaseHistoryFilters,
): Promise<{
  orders: PurchaseHistoryOrderView[]
  total: number
  page: number
  pageSize: number
  departments: string[]
}> {
  const erpCode = await loadErpCode(customerId)
  const erpLines = erpCode ? await loadErpLines(erpCode, filters) : []
  const webLines = await fetchWebPurchaseHistoryLines(customerId)
  const grouped = filterOrderGroups(
    groupRawLinesIntoOrders(filterNonWildcardLines([...erpLines, ...webLines])),
    filters,
  )

  const allSkus = [...new Set(grouped.flatMap((order) => order.lines.map((line) => line.sku)))]
  const products = await fetchPublicProductsBySkus(allSkus)
  const productBySku = new Map(products.map((p) => [p.skuErp?.trim() ?? '', p]))

  let working = grouped
  if (filters.categoryId?.trim()) {
    working = filterOrdersByCategory(grouped, filters.categoryId.trim(), productBySku)
  }

  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE))
  const total = working.length
  const slice = working.slice((page - 1) * pageSize, page * pageSize)
  const skus = [...new Set(slice.flatMap((order) => order.lines.map((line) => line.sku)))]
  const quotes = await resolvePriceQuotesBatch(skus, customerId)

  const orders: PurchaseHistoryOrderView[] = slice.map((order) => ({
    orderKey: order.orderKey,
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    purchasedAt: order.purchasedAt,
    department: order.department,
    lines: order.lines.map((line) => enrichOrderLine(line, productBySku, quotes)),
  }))

  const departments = [
    ...new Set(grouped.map((order) => order.department).filter((d): d is string => Boolean(d?.trim()))),
  ].sort()

  return {
    orders,
    total,
    page,
    pageSize,
    departments,
  }
}
