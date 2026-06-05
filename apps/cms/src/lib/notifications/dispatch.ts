import type { Payload } from 'payload'
import type { Json } from '@jeyjo/database-types'

import { getSupabaseServerClient } from '@/lib/supabase-server'

import { allowsEmail, allowsPortal, channelFieldForType } from './channels'
import { isNotificationsEnabled } from './env'
import { sendProactiveEmail, isHardBounceError } from './emails/send-proactive-email'
import type { DispatchNotificationInput } from './types'

const B2B_ROLES = ['b2b_superadmin', 'b2b_subuser'] as const

type WebProfileRow = {
  id: string
  email: string
  role: string
}

type PreferencesRow = {
  web_profile_id: string
  invoice_channel: string
  order_channel: string
  quote_channel: string
  wishlist_channel: string
  email_disabled_at: string | null
}

export async function dispatchNotification(
  payload: Payload,
  input: DispatchNotificationInput,
): Promise<{ created: number; emailsSent: number }> {
  if (!isNotificationsEnabled()) {
    return { created: 0, emailsSent: 0 }
  }

  const supabase = getSupabaseServerClient()
  if (!supabase) {
    payload.logger.warn('[notifications] Skipping dispatch — Supabase not configured')
    return { created: 0, emailsSent: 0 }
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('web_profiles')
    .select('id, email, role')
    .eq('customer_id', input.customerId)
    .eq('is_active', true)
    .in('role', [...B2B_ROLES])

  if (profilesError) {
    throw new Error(`web_profiles query failed: ${profilesError.message}`)
  }

  const b2bProfiles = (profiles ?? []) as WebProfileRow[]
  if (b2bProfiles.length === 0) {
    return { created: 0, emailsSent: 0 }
  }

  const profileIds = b2bProfiles.map((p) => p.id)
  const { data: prefsRows } = await supabase
    .from('notification_preferences')
    .select('web_profile_id, invoice_channel, order_channel, quote_channel, wishlist_channel, email_disabled_at')
    .in('web_profile_id', profileIds)

  const prefsByProfile = new Map(
    ((prefsRows ?? []) as PreferencesRow[]).map((r) => [r.web_profile_id, r]),
  )

  const channelField = channelFieldForType(input.type)
  let created = 0
  let emailsSent = 0

  for (const profile of b2bProfiles) {
    const prefs = prefsByProfile.get(profile.id)
    const channel = (prefs?.[channelField] ?? 'email') as 'email' | 'portal' | 'off'
    const emailDisabled = Boolean(prefs?.email_disabled_at)
    const idempotencyKey = `${input.idempotencyKey}:${profile.id}`

    let notificationId: string | null = null

    if (allowsPortal(channel)) {
      const { data: inserted, error: insertError } = await supabase
        .from('notifications')
        .insert({
          web_profile_id: profile.id,
          customer_id: input.customerId,
          type: input.type,
          title: input.title,
          body: input.body ?? null,
          payload: (input.payload ?? {}) as Json,
          idempotency_key: idempotencyKey,
        })
        .select('id')
        .maybeSingle()

      if (insertError) {
        if (insertError.code === '23505') continue
        throw new Error(`notifications insert failed: ${insertError.message}`)
      }
      if (inserted?.id) {
        notificationId = inserted.id
        created += 1
      }
    }

    const emailTo = input.emailTo ?? profile.email
    if (allowsEmail(channel, emailDisabled) && emailTo) {
      try {
        const sent = await sendProactiveEmail(payload, {
          to: emailTo,
          type: input.type,
          title: input.title,
          body: input.body,
          payload: input.payload,
        })
        if (sent) {
          emailsSent += 1
          if (notificationId) {
            await supabase
              .from('notifications')
              .update({ email_sent_at: new Date().toISOString() })
              .eq('id', notificationId)
          }
        }
      } catch (emailErr) {
        if (isHardBounceError(emailErr)) {
          await supabase.from('notification_preferences').upsert({
            web_profile_id: profile.id,
            email_disabled_at: new Date().toISOString(),
          })
        }
      }
    }
  }

  return { created, emailsSent }
}
