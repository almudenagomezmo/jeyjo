import type { Payload } from 'payload'

import { sendAbandonedCartFirstEmail, sendAbandonedCartSecondEmail } from './emails/abandoned-cart'
import { createRecoveryCoupon } from './recovery-coupon'
import { signCartRecoverToken } from './recover-token'

type SnapshotRow = {
  id: string
  web_profile_id: string
  customer_id: string
  lines: { productId: string; qty: number }[]
  last_activity_at: string
  status: string
  first_email_sent_at: string | null
  second_email_sent_at: string | null
  recovery_coupon_id: string | null
  converted_order_id: string | null
}

type MarketingSettingsDoc = {
  abandonedCartEnabled?: boolean
  firstEmailDelayMinutes?: number
  secondEmailDelayMinutes?: number
  secondEmailDiscountPercent?: number
  secondEmailUseFixedCoupon?: number | { id: number; code?: string } | null
  b2bRecoveryEnabled?: boolean
  b2bRecoveryCustomerGroups?: { code?: string | null }[] | null
}

function minutesAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 60_000
}

function storefrontBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_STOREFRONT_URL ??
    process.env.STOREFRONT_URL ??
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

async function fetchEligibleSnapshots(payload: Payload): Promise<SnapshotRow[]> {
  const { getSupabaseServerClient } = await import('@/lib/supabase-server')
  const admin = getSupabaseServerClient()
  if (!admin) return []

  const { data, error } = await admin
    .from('abandoned_cart_snapshots')
    .select('*')
    .eq('status', 'active')
    .is('converted_order_id', null)

  if (error) {
    payload.logger.error({ msg: 'abandoned cart query failed', error })
    return []
  }

  return (data ?? [])
    .filter((row) => Array.isArray(row.lines) && row.lines.length > 0)
    .map((row) => ({
      ...row,
      lines: row.lines as SnapshotRow['lines'],
    })) as SnapshotRow[]
}

async function profileEmail(
  payload: Payload,
  webProfileId: string,
): Promise<{ email: string; segment: 'b2c' | 'b2b'; customerGroup: number } | null> {
  const { getSupabaseServerClient } = await import('@/lib/supabase-server')
  const admin = getSupabaseServerClient()
  if (!admin) return null

  const { data: profile } = await admin
    .from('web_profiles')
    .select(
      'email, customers!web_profiles_customer_id_fkey ( customer_group, validated_at )',
    )
    .eq('id', webProfileId)
    .maybeSingle()

  if (!profile?.email) return null
  const customer = profile.customers
  const row = Array.isArray(customer) ? customer[0] : customer
  const group = row?.customer_group ?? 1
  const validated = Boolean(row?.validated_at)
  const segment =
    validated && group >= 2 && group <= 4 ? ('b2b' as const) : ('b2c' as const)
  return { email: profile.email, segment, customerGroup: group }
}

function b2bRecoveryAllowed(
  settings: MarketingSettingsDoc,
  customerGroup: number,
): boolean {
  if (!settings.b2bRecoveryEnabled) return false
  const allowed = (settings.b2bRecoveryCustomerGroups ?? [])
    .map((g) => String(g.code ?? '').trim())
    .filter(Boolean)
  return allowed.includes(String(customerGroup))
}

export async function runAbandonedCartRecovery(payload: Payload): Promise<{
  firstSent: number
  secondSent: number
  skipped: number
}> {
  const settings = (await payload.findGlobal({
    slug: 'marketingSettings',
    depth: 1,
  })) as MarketingSettingsDoc

  if (!settings.abandonedCartEnabled) {
    return { firstSent: 0, secondSent: 0, skipped: 0 }
  }

  const firstDelay = settings.firstEmailDelayMinutes ?? 120
  const secondDelay = settings.secondEmailDelayMinutes ?? 1440
  const snapshots = await fetchEligibleSnapshots(payload)

  let firstSent = 0
  let secondSent = 0
  let skipped = 0

  const { getSupabaseServerClient } = await import('@/lib/supabase-server')
  const admin = getSupabaseServerClient()

  for (const snap of snapshots) {
    const profile = await profileEmail(payload, snap.web_profile_id)
    if (!profile) {
      skipped += 1
      continue
    }

    if (profile.segment === 'b2b' && !b2bRecoveryAllowed(settings, profile.customerGroup)) {
      skipped += 1
      continue
    }

    const inactiveMinutes = minutesAgo(snap.last_activity_at)
    const recoverUrl = `${storefrontBaseUrl()}/cart?recover=${signCartRecoverToken({
      snapshotId: snap.id,
      lines: snap.lines,
    })}`

    if (!snap.first_email_sent_at && inactiveMinutes >= firstDelay) {
      const ok = await sendAbandonedCartFirstEmail(payload, {
        to: profile.email,
        recoverUrl,
      })
      if (ok && admin) {
        await admin
          .from('abandoned_cart_snapshots')
          .update({ first_email_sent_at: new Date().toISOString() })
          .eq('id', snap.id)
        firstSent += 1
      }
      continue
    }

    if (
      snap.first_email_sent_at &&
      !snap.second_email_sent_at &&
      inactiveMinutes >= secondDelay &&
      snap.status === 'active' &&
      !snap.converted_order_id
    ) {
      let couponCode: string | null = null
      const fixed = settings.secondEmailUseFixedCoupon
      if (fixed && typeof fixed === 'object' && fixed.code) {
        couponCode = fixed.code
      } else if (typeof fixed === 'number') {
        const doc = await payload.findByID({
          collection: 'coupons',
          id: fixed,
          depth: 0,
        })
        couponCode = typeof doc.code === 'string' ? doc.code : null
      } else {
        couponCode = await createRecoveryCoupon(payload, {
          snapshotId: snap.id,
          percent: settings.secondEmailDiscountPercent ?? 10,
        })
      }

      const ok = await sendAbandonedCartSecondEmail(payload, {
        to: profile.email,
        recoverUrl,
        couponCode,
        discountPercent: settings.secondEmailDiscountPercent ?? 10,
      })

      if (ok && admin) {
        await admin
          .from('abandoned_cart_snapshots')
          .update({
            second_email_sent_at: new Date().toISOString(),
            recovery_coupon_id: couponCode,
          })
          .eq('id', snap.id)
        secondSent += 1
      }
    }
  }

  return { firstSent, secondSent, skipped }
}
