import {
  createStubPurchaseHistoryReader,
  type ErpPurchaseHistoryLineDto,
} from '@jeyjo/erp-ports'

import { fetchWebConfirmedPurchaseHistoryLines } from '@/lib/orders/fetch-customer-orders'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { filterNonWildcardLines } from '@/lib/intranet/purchase-history/wildcard'
import { mergePurchaseHistoryLines } from '@/lib/intranet/purchase-history/merge'

function historyYearsWindow(): number {
  const raw = process.env.PURCHASE_HISTORY_YEARS
  const n = raw ? Number.parseInt(raw, 10) : 5
  return Number.isFinite(n) && n > 0 ? n : 5
}

function normalizeSku(sku: string): string {
  return sku.trim().toUpperCase()
}

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

async function loadErpLines(erpCode: string): Promise<
  Array<{ sku: string; quantity: number; purchasedAt: string; historicalUnitPrice: number }>
> {
  const years = historyYearsWindow()
  const from = new Date()
  from.setFullYear(from.getFullYear() - years)

  const reader = createStubPurchaseHistoryReader()
  const rows = await reader.listLines(erpCode, {
    from: from.toISOString(),
    to: new Date().toISOString(),
    limit: 500,
  })
  return rows.map((r: ErpPurchaseHistoryLineDto) => ({
    sku: r.sku,
    quantity: r.quantity,
    purchasedAt: r.purchasedAt,
    historicalUnitPrice: r.historicalUnitPrice ?? 0,
  }))
}

export async function assertCustomerPurchasedSku(
  customerId: string,
  sku: string,
): Promise<boolean> {
  const needle = normalizeSku(sku)
  if (!needle) return false

  const webLines = await fetchWebConfirmedPurchaseHistoryLines(customerId)
  const erpCode = await loadErpCode(customerId)
  const erpLines = erpCode ? await loadErpLines(erpCode) : []
  const merged = mergePurchaseHistoryLines(filterNonWildcardLines([...erpLines, ...webLines]))

  return merged.some((line) => normalizeSku(line.sku) === needle)
}
