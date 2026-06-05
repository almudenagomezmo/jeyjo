import { getCustomerContext } from '@/lib/auth/customer-context'
import { resolveCheckoutSegment } from '@/lib/checkout/segment'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import type { CartLine } from '@/lib/types'

export async function syncAbandonedCartSnapshot(
  lines: CartLine[],
): Promise<{ ok: boolean; reason?: string }> {
  const ctx = await getCustomerContext()
  if (!ctx) return { ok: false, reason: 'guest' }

  const segment = resolveCheckoutSegment(ctx)
  if (segment !== 'b2c') return { ok: false, reason: 'not_b2c' }

  const admin = getSupabaseAdminClient()
  if (!admin) return { ok: false, reason: 'no_admin' }

  const payload = lines
    .filter((l) => l.productId && l.qty > 0)
    .map((l) => ({ productId: l.productId, qty: l.qty }))

  if (payload.length === 0) {
    await admin
      .from('abandoned_cart_snapshots')
      .delete()
      .eq('web_profile_id', ctx.userId)
    return { ok: true }
  }

  const now = new Date().toISOString()
  const { error } = await admin.from('abandoned_cart_snapshots').upsert(
    {
      web_profile_id: ctx.userId,
      customer_id: ctx.customerId,
      lines: payload,
      last_activity_at: now,
      status: 'active',
      updated_at: now,
    },
    { onConflict: 'web_profile_id' },
  )

  if (error) return { ok: false, reason: error.message }
  return { ok: true }
}

export async function markAbandonedCartConverted(
  webProfileId: string,
  orderId: string,
): Promise<void> {
  const admin = getSupabaseAdminClient()
  if (!admin) return

  await admin
    .from('abandoned_cart_snapshots')
    .update({
      status: 'converted',
      converted_order_id: orderId,
      updated_at: new Date().toISOString(),
    })
    .eq('web_profile_id', webProfileId)
    .eq('status', 'active')
}
