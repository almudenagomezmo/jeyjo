import type { RawPurchaseHistoryLine } from '@/lib/intranet/purchase-history/types'

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

const CONFIRMED_STATUSES = new Set(['confirmed', 'preparing', 'shipped', 'delivered'])

type PayloadOrderRow = {
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

export async function fetchWebPurchaseHistoryLines(
  customerId: string,
): Promise<RawPurchaseHistoryLine[]> {
  const base = payloadBaseUrl()
  const headers = payloadHeaders()
  if (!base || !headers) return []

  const fromDate = windowFromDate()
  const params = new URLSearchParams({
    limit: '200',
    depth: '0',
    'where[customerRef][equals]': customerId,
    'where[createdAt][greater_than_equal]': fromDate,
  })

  const res = await fetch(`${base.replace(/\/$/, '')}/api/orders?${params}`, {
    headers,
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return []

  const data = (await res.json()) as { docs?: PayloadOrderRow[] }
  const out: RawPurchaseHistoryLine[] = []

  for (const order of data.docs ?? []) {
    const status = order.jeyjoStatus ?? ''
    if (!CONFIRMED_STATUSES.has(status)) continue

    const purchasedAt = order.createdAt?.slice(0, 10) ?? ''
    if (!purchasedAt || purchasedAt < fromDate) continue

    for (const line of parseSnapshots(order.orderLineSnapshots)) {
      out.push({
        sku: line.skuErp,
        quantity: line.qty,
        purchasedAt,
        historicalUnitPrice: line.unitPrice,
      })
    }
  }

  return out
}
