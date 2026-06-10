import type { RawPurchaseHistoryLine } from '@/lib/intranet/purchase-history/types'
import {
  CONFIRMED_PURCHASE_STATUSES,
  PURCHASE_HISTORY_WEB_STATUSES,
} from '@/lib/orders/purchase-history-status'

function parseSnapshots(raw: unknown): Array<{ skuErp: string; qty: number; unitPrice: number }> {
  if (!Array.isArray(raw)) return []
  const lines: Array<{ skuErp: string; qty: number; unitPrice: number }> = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const row = entry as Record<string, unknown>
    const skuErp = String(row.skuErp ?? row.sku ?? '').trim()
    const qty = Number(row.qty ?? row.quantity ?? 0)
    const unitPrice = Number(row.unitPrice ?? row.price ?? 0)
    if (!skuErp || !Number.isFinite(qty) || qty <= 0) continue
    lines.push({
      skuErp,
      qty,
      unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
    })
  }
  return lines
}

type PayloadOrderRow = {
  id?: number
  orderNumber?: string | null
  createdAt?: string
  jeyjoStatus?: string | null
  customerRef?: string | null
  orderLineSnapshots?: unknown
}

function payloadBaseUrl(): string | null {
  return (
    process.env.CMS_INTERNAL_URL ??
    process.env.CMS_URL ??
    process.env.NEXT_PUBLIC_PAYLOAD_URL ??
    null
  )
}

function payloadHeaders(): HeadersInit | null {
  const apiKey = process.env.STOREFRONT_PAYLOAD_API_KEY
  if (!apiKey) return null
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }
}

function historyYearsWindow(): number {
  const raw = process.env.PURCHASE_HISTORY_YEARS
  const n = raw ? Number.parseInt(raw, 10) : 5
  return Number.isFinite(n) && n > 0 ? n : 5
}

function windowFromDate(): string {
  const years = historyYearsWindow()
  const d = new Date()
  d.setFullYear(d.getFullYear() - years)
  return d.toISOString().slice(0, 10)
}

export type CustomerWebOrder = {
  id: number
  orderNumber: string | null
  createdAt: string
  jeyjoStatus: string | null
  origin: string | null
  amount: number | null
  deliveryMethod: string | null
  pickupStoreLabel: string | null
  orderLineSnapshots?: unknown
}

export type CustomerWebOrderDetail = CustomerWebOrder & {
  shippingCost: number | null
  paymentMethodLabel: string | null
  couponCode: string | null
  customerNotes: string | null
  orderLineSnapshots: unknown
}

type FetchCustomerWebOrdersOptions = {
  limit?: number
  includeLineSnapshots?: boolean
}

export async function fetchCustomerWebOrders(
  customerId: string,
  options?: FetchCustomerWebOrdersOptions,
): Promise<CustomerWebOrder[]> {
  const base = payloadBaseUrl()
  const headers = payloadHeaders()
  if (!base || !headers) return []

  const params = new URLSearchParams({ customerRef: customerId })
  if (options?.limit) params.set('limit', String(options.limit))
  if (options?.includeLineSnapshots) params.set('includeLineSnapshots', '1')

  const res = await fetch(`${base.replace(/\/$/, '')}/api/orders/storefront-mine?${params}`, {
    headers,
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return []

  const data = (await res.json()) as { docs?: CustomerWebOrder[] }
  return data.docs ?? []
}

export async function fetchCustomerWebOrderDetail(
  customerId: string,
  orderId: number,
): Promise<CustomerWebOrderDetail | null> {
  const base = payloadBaseUrl()
  const headers = payloadHeaders()
  if (!base || !headers || !Number.isFinite(orderId)) return null

  const params = new URLSearchParams({
    customerRef: customerId,
    orderId: String(orderId),
  })

  const res = await fetch(`${base.replace(/\/$/, '')}/api/orders/storefront-detail?${params}`, {
    headers,
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return null

  const data = (await res.json()) as { doc?: CustomerWebOrderDetail }
  return data.doc ?? null
}

async function fetchWebOrderHistoryLines(
  customerId: string,
  eligibleStatuses: Set<string>,
): Promise<RawPurchaseHistoryLine[]> {
  const fromDate = windowFromDate()
  const orders = await fetchCustomerWebOrders(customerId, {
    limit: 200,
    includeLineSnapshots: true,
  })
  const out: RawPurchaseHistoryLine[] = []

  for (const order of orders as PayloadOrderRow[]) {
    const status = order.jeyjoStatus ?? ''
    if (!eligibleStatuses.has(status)) continue

    const purchasedAt = order.createdAt?.slice(0, 10) ?? ''
    if (!purchasedAt || purchasedAt < fromDate) continue

    for (const line of parseSnapshots(order.orderLineSnapshots)) {
      out.push({
        sku: line.skuErp,
        quantity: line.qty,
        purchasedAt,
        historicalUnitPrice: line.unitPrice,
        orderStatus: order.jeyjoStatus ?? null,
        orderNumber: order.orderNumber ?? null,
        orderId: order.id ?? null,
      })
    }
  }

  return out
}

function filterOrdersInHistoryWindow(orders: CustomerWebOrder[]): CustomerWebOrder[] {
  const fromDate = windowFromDate()
  return orders.filter((order) => {
    const status = order.jeyjoStatus ?? ''
    if (!PURCHASE_HISTORY_WEB_STATUSES.has(status)) return false
    const purchasedAt = order.createdAt?.slice(0, 10) ?? ''
    return Boolean(purchasedAt && purchasedAt >= fromDate)
  })
}

export async function fetchPurchaseHistoryWebOrders(
  customerId: string,
): Promise<CustomerWebOrder[]> {
  const orders = await fetchCustomerWebOrders(customerId, { limit: 200 })
  return filterOrdersInHistoryWindow(orders)
}

export async function fetchWebPurchaseHistoryLines(
  customerId: string,
): Promise<RawPurchaseHistoryLine[]> {
  return fetchWebOrderHistoryLines(customerId, PURCHASE_HISTORY_WEB_STATUSES)
}

export async function fetchWebConfirmedPurchaseHistoryLines(
  customerId: string,
): Promise<RawPurchaseHistoryLine[]> {
  return fetchWebOrderHistoryLines(customerId, CONFIRMED_PURCHASE_STATUSES)
}
