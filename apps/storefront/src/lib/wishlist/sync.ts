import { getCustomerContext } from '@/lib/auth/customer-context'
import { getStockIndicator } from '@/lib/stock/get-stock-indicator'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export async function listWishlistSkus(webProfileId: string): Promise<string[]> {
  const admin = getSupabaseAdminClient()
  if (!admin) return []

  const { data, error } = await admin
    .from('stock_watches')
    .select('sku')
    .eq('web_profile_id', webProfileId)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []).map((r) => r.sku)
}

export async function upsertWishlistWatch(args: {
  webProfileId: string
  sku: string
  productTitle?: string | null
}): Promise<{ ok: boolean; reason?: string }> {
  const admin = getSupabaseAdminClient()
  if (!admin) return { ok: false, reason: 'no_admin' }

  let lastIndicator: string | null = null
  const indicator = await getStockIndicator(args.sku)
  if (indicator) lastIndicator = indicator.level

  const { error } = await admin.from('stock_watches').upsert(
    {
      web_profile_id: args.webProfileId,
      sku: args.sku,
      product_title: args.productTitle?.trim() || null,
      last_indicator: lastIndicator,
    },
    { onConflict: 'web_profile_id,sku' },
  )

  if (error) return { ok: false, reason: error.message }
  return { ok: true }
}

export async function removeWishlistWatch(
  webProfileId: string,
  sku: string,
): Promise<{ ok: boolean; reason?: string }> {
  const admin = getSupabaseAdminClient()
  if (!admin) return { ok: false, reason: 'no_admin' }

  const { error } = await admin
    .from('stock_watches')
    .delete()
    .eq('web_profile_id', webProfileId)
    .eq('sku', sku)

  if (error) return { ok: false, reason: error.message }
  return { ok: true }
}

export async function replaceWishlistSkus(
  webProfileId: string,
  skus: string[],
): Promise<{ ok: boolean; reason?: string }> {
  const admin = getSupabaseAdminClient()
  if (!admin) return { ok: false, reason: 'no_admin' }

  const unique = [...new Set(skus.map((s) => s.trim()).filter(Boolean))]
  const { data: existing } = await admin
    .from('stock_watches')
    .select('sku')
    .eq('web_profile_id', webProfileId)

  const existingSkus = new Set((existing ?? []).map((r) => r.sku))
  const toAdd = unique.filter((s) => !existingSkus.has(s))
  const toRemove = [...existingSkus].filter((s) => !unique.includes(s))

  for (const sku of toRemove) {
    await admin.from('stock_watches').delete().eq('web_profile_id', webProfileId).eq('sku', sku)
  }

  for (const sku of toAdd) {
    await upsertWishlistWatch({ webProfileId, sku })
  }

  return { ok: true }
}

export async function requireWishlistSession() {
  const ctx = await getCustomerContext()
  if (!ctx) return { error: 'guest' as const }
  if (!ctx.isActive) return { error: 'disabled' as const }
  return { ctx }
}
