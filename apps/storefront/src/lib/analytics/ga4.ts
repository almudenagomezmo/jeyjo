export type Ga4Item = {
  item_id: string
  item_name?: string
  price?: number
  quantity?: number
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

export function getGa4MeasurementId(): string | null {
  const id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim()
  return id || null
}

export function ga4Enabled(): boolean {
  if (typeof window === 'undefined') return false
  if (process.env.NEXT_PUBLIC_GA4_ENABLED === 'false') return false
  return Boolean(getGa4MeasurementId())
}

function toGa4Item(item: Ga4Item) {
  return {
    item_id: item.item_id,
    item_name: item.item_name,
    price: item.price,
    quantity: item.quantity ?? 1,
  }
}

function emit(event: string, params: Record<string, unknown>): void {
  if (!ga4Enabled()) return
  window.gtag?.('event', event, params)
}

export function trackPageView(path: string): void {
  emit('page_view', { page_path: path })
}

export function trackViewItem(item: Ga4Item): void {
  emit('view_item', {
    currency: 'EUR',
    value: item.price,
    items: [toGa4Item(item)],
  })
}

export function trackAddToCart(item: Ga4Item & { quantity: number }): void {
  emit('add_to_cart', {
    currency: 'EUR',
    value: (item.price ?? 0) * item.quantity,
    items: [toGa4Item({ ...item, quantity: item.quantity })],
  })
}

export function trackAddToCartBatch(items: Ga4Item[]): void {
  if (items.length === 0) return
  const value = items.reduce((sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 1), 0)
  emit('add_to_cart', {
    currency: 'EUR',
    value,
    items: items.map(toGa4Item),
  })
}

export function trackBeginCheckout(items: Ga4Item[], value: number): void {
  emit('begin_checkout', {
    currency: 'EUR',
    value,
    items: items.map(toGa4Item),
  })
}

export function trackPurchase(params: {
  transactionId: string
  value: number
  tax?: number
  shipping?: number
  items: Ga4Item[]
}): void {
  emit('purchase', {
    transaction_id: params.transactionId,
    currency: 'EUR',
    value: params.value,
    tax: params.tax,
    shipping: params.shipping,
    items: params.items.map(toGa4Item),
  })
}
