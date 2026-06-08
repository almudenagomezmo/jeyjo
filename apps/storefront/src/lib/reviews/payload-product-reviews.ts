import type { ProductReviewMine, ProductReviewPublic, ProductReviewsPage } from './types'

function payloadBaseUrl(): string | null {
  return (
    process.env.CMS_INTERNAL_URL ??
    process.env.CMS_URL ??
    process.env.NEXT_PUBLIC_PAYLOAD_URL ??
    null
  )
}

function payloadApiKey(): string | null {
  return process.env.STOREFRONT_PAYLOAD_API_KEY ?? null
}

function authHeaders(): Record<string, string> | null {
  const key = payloadApiKey()
  if (!key) return null
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
  }
}

export async function listApprovedProductReviews(
  productId: number,
  page = 1,
  pageSize = 10,
): Promise<ProductReviewsPage | null> {
  const base = payloadBaseUrl()
  const headers = authHeaders()
  if (!base || !headers) return null

  const params = new URLSearchParams({
    productId: String(productId),
    page: String(page),
    pageSize: String(pageSize),
  })

  const res = await fetch(
    `${base.replace(/\/$/, '')}/api/product-reviews/storefront-list?${params}`,
    { headers, cache: 'no-store', signal: AbortSignal.timeout(8000) },
  )
  if (!res.ok) return null

  const data = (await res.json()) as {
    docs: ProductReviewPublic[]
    total: number
    page: number
    pageSize: number
  }
  return {
    docs: data.docs,
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
  }
}

export async function fetchCustomerProductReview(
  productId: number,
  webProfileId: string,
): Promise<ProductReviewMine | null> {
  const base = payloadBaseUrl()
  const headers = authHeaders()
  if (!base || !headers) return null

  const params = new URLSearchParams({
    productId: String(productId),
    webProfileId,
  })

  const res = await fetch(
    `${base.replace(/\/$/, '')}/api/product-reviews/storefront-mine?${params}`,
    { headers, cache: 'no-store', signal: AbortSignal.timeout(8000) },
  )
  if (!res.ok) return null

  const data = (await res.json()) as { doc: ProductReviewMine | null }
  return data.doc
}

export async function createProductReview(input: {
  productId: number
  skuErp: string
  customerId: string
  webProfileId: string
  authorDisplayName: string
  rating: number
  comment: string
}): Promise<{ id: number; status: string }> {
  const base = payloadBaseUrl()
  const headers = authHeaders()
  if (!base || !headers) throw new Error('CMS not configured')

  const res = await fetch(`${base.replace(/\/$/, '')}/api/product-reviews/storefront-create`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(8000),
  })

  if (res.status === 409) {
    throw new Error('DUPLICATE_REVIEW')
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text.slice(0, 200) || `Create failed (${res.status})`)
  }

  const data = (await res.json()) as { doc: { id: number; status: string } }
  return data.doc
}

export async function updateProductReview(input: {
  id: number
  webProfileId: string
  authorDisplayName: string
  rating: number
  comment: string
}): Promise<{ id: number; status: string }> {
  const base = payloadBaseUrl()
  const headers = authHeaders()
  if (!base || !headers) throw new Error('CMS not configured')

  const res = await fetch(`${base.replace(/\/$/, '')}/api/product-reviews/storefront-update`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text.slice(0, 200) || `Update failed (${res.status})`)
  }

  const data = (await res.json()) as { doc: { id: number; status: string } }
  return data.doc
}
