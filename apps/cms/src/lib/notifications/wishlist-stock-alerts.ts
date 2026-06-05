import type { Payload } from 'payload'

import type { StockIndicatorTransition } from '@/stock/recalculateIndicators'

import { dispatchProfileNotification } from './dispatch-profile'
import { isWishlistStockAlertsEnabled } from './env'
import { getSupabaseServerClient } from '@/lib/supabase-server'

const MAX_DISPATCHES_PER_RUN = 500

type WatchRow = {
  id: string
  web_profile_id: string
  sku: string
  customer_id?: string
}

export type WishlistStockAlertsResult = {
  transitionsEvaluated: number
  dispatchesAttempted: number
  notificationsCreated: number
  emailsSent: number
  capped: boolean
}

export async function processWishlistStockAlerts(
  payload: Payload,
  args: {
    transitions: StockIndicatorTransition[]
    syncRunId: string | null
  },
): Promise<WishlistStockAlertsResult> {
  const empty: WishlistStockAlertsResult = {
    transitionsEvaluated: 0,
    dispatchesAttempted: 0,
    notificationsCreated: 0,
    emailsSent: 0,
    capped: false,
  }

  if (!isWishlistStockAlertsEnabled() || args.transitions.length === 0) {
    return empty
  }

  const supabase = getSupabaseServerClient()
  if (!supabase) {
    payload.logger.warn('[wishlist-stock] Skipping — Supabase not configured')
    return empty
  }

  const alertable = args.transitions.filter(
    (t) =>
      t.previousIndicator === 'limited' &&
      (t.newIndicator === 'available' || t.newIndicator === 'low'),
  )

  if (alertable.length === 0) {
    return empty
  }

  let dispatchesAttempted = 0
  let notificationsCreated = 0
  let emailsSent = 0
  let capped = false
  const now = new Date().toISOString()

  for (const transition of alertable) {
    const { data: watches, error } = await supabase
      .from('stock_watches')
      .select('id, web_profile_id, sku')
      .eq('sku', transition.sku)

    if (error) {
      payload.logger.error({ msg: '[wishlist-stock] watch query failed', error, sku: transition.sku })
      continue
    }

    for (const watch of (watches ?? []) as WatchRow[]) {
      if (dispatchesAttempted >= MAX_DISPATCHES_PER_RUN) {
        capped = true
        payload.logger.warn(
          `[wishlist-stock] Dispatch cap ${MAX_DISPATCHES_PER_RUN} reached for sync ${args.syncRunId ?? 'n/a'}`,
        )
        break
      }

      const { data: profile } = await supabase
        .from('web_profiles')
        .select('id, customer_id, role')
        .eq('id', watch.web_profile_id)
        .eq('is_active', true)
        .in('role', ['b2b_superadmin', 'b2b_subuser'])
        .maybeSingle()

      if (!profile?.customer_id) continue

      const syncKey = args.syncRunId ?? 'manual'
      const idempotencyKey = `stock:${transition.sku}:${watch.web_profile_id}:${syncKey}`

      const result = await dispatchProfileNotification(payload, {
        webProfileId: watch.web_profile_id,
        customerId: profile.customer_id,
        type: 'stock_available',
        title: `Stock disponible: ${transition.sku}`,
        body: `${transition.productTitle} ya tiene stock (${transition.stockLabel}).`,
        payload: {
          sku: transition.sku,
          productTitle: transition.productTitle,
          stockLabel: transition.stockLabel,
          href: `/p/${transition.slug}`,
        },
        idempotencyKey,
      })

      dispatchesAttempted += 1
      notificationsCreated += result.created
      emailsSent += result.emailsSent

      if (result.created > 0 || result.emailsSent > 0) {
        await supabase
          .from('stock_watches')
          .update({
            last_indicator: transition.newIndicator,
            last_notified_at: now,
          })
          .eq('id', watch.id)
      }
    }

    if (capped) break
  }

  return {
    transitionsEvaluated: alertable.length,
    dispatchesAttempted,
    notificationsCreated,
    emailsSent,
    capped,
  }
}
