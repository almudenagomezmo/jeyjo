export async function fetchWishlistSkus(): Promise<string[] | null> {
  const res = await fetch('/api/wishlist', { credentials: 'include' })
  if (res.status === 401) return null
  if (!res.ok) return null
  const data = (await res.json()) as { skus?: string[] }
  return Array.isArray(data.skus) ? data.skus : []
}

export async function syncWishlistSkus(skus: string[]): Promise<string[] | null> {
  const res = await fetch('/api/wishlist', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skus }),
  })
  if (res.status === 401) return null
  if (!res.ok) return null
  const data = (await res.json()) as { skus?: string[] }
  return Array.isArray(data.skus) ? data.skus : skus
}

export async function addWishlistSku(sku: string, productTitle?: string): Promise<boolean> {
  const res = await fetch('/api/wishlist', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sku, productTitle }),
  })
  return res.ok
}

export async function removeWishlistSku(sku: string): Promise<boolean> {
  const res = await fetch(`/api/wishlist?sku=${encodeURIComponent(sku)}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  return res.ok
}
