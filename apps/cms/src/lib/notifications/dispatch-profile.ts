import type { Payload } from 'payload'
import type { Json } from '@jeyjo/database-types'

import { getSupabaseServerClient } from '@/lib/supabase-server'

import { allowsEmail, allowsPortal, channelFieldForType } from './channels'
import { isWishlistStockAlertsEnabled } from './env'
import { sendProactiveEmail, isHardBounceError } from './emails/send-proactive-email'
import type { DispatchProfileNotificationInput } from './types'

type PreferencesRow = {
  web_profile_id: string
  invoice_channel: string
  order_channel: string
  quote_channel: string
  wishlist_channel: string
  email_disabled_at: string | null
}

type ProfileRow = {
  id: string
  email: string
}

export async function dispatchProfileNotification(
  payload: Payload,
  input: DispatchProfileNotificationInput,
): Promise<{ created: number; emailsSent: number }> {
  if (!isWishlistStockAlertsEnabled()) {
    return { created: 0, emailsSent: 0 }
  }

  const supabase = getSupabaseServerClient()
  if (!supabase) {
    payload.logger.warn('[notifications] Skipping profile dispatch — Supabase not configured')
    return { created: 0, emailsSent: 0 }
  }

  const { data: profile, error: profileError } = await supabase
    .from('web_profiles')
    .select('id, email')
    .eq('id', input.webProfileId)
    .eq('is_active', true)
    .maybeSingle()

  if (profileError) {
    throw new Error(`web_profiles query failed: ${profileError.message}`)
  }
  if (!profile) {
    return { created: 0, emailsSent: 0 }
  }

  const row = profile as ProfileRow
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select(
      'web_profile_id, invoice_channel, order_channel, quote_channel, wishlist_channel, email_disabled_at',
    )
    .eq('web_profile_id', input.webProfileId)
    .maybeSingle()

  const prefsRow = prefs as PreferencesRow | null
  const channelField = channelFieldForType(input.type)
  const channel = (prefsRow?.[channelField] ?? 'email') as 'email' | 'portal' | 'off'
  const emailDisabled = Boolean(prefsRow?.email_disabled_at)

  let created = 0
  let emailsSent = 0
  let notificationId: string | null = null

  if (allowsPortal(channel)) {
    const { data: inserted, error: insertError } = await supabase
      .from('notifications')
      .insert({
        web_profile_id: input.webProfileId,
        customer_id: input.customerId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        payload: (input.payload ?? {}) as Json,
        idempotency_key: input.idempotencyKey,
      })
      .select('id')
      .maybeSingle()

    if (insertError) {
      if (insertError.code === '23505') {
        return { created: 0, emailsSent: 0 }
      }
      throw new Error(`notifications insert failed: ${insertError.message}`)
    }
    if (inserted?.id) {
      notificationId = inserted.id
      created += 1
    }
  }

  const emailTo = input.emailTo ?? row.email
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
          web_profile_id: input.webProfileId,
          email_disabled_at: new Date().toISOString(),
        })
      }
    }
  }

  return { created, emailsSent }
}
