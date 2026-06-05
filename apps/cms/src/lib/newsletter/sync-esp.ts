import type { Payload } from 'payload'

import { createNewsletterEspPort } from './esp'
import { markEspSynced } from './repository'
import { getSupabaseServerClient } from '@/lib/supabase-server'

import type { NewsletterSubscriberRow } from './types'

async function resolveSegment(webProfileId: string | null): Promise<'b2b' | 'b2c'> {
  if (!webProfileId) return 'b2c'
  const supabase = getSupabaseServerClient()
  if (!supabase) return 'b2c'

  const { data: profile } = await supabase
    .from('web_profiles')
    .select('customer_id')
    .eq('id', webProfileId)
    .maybeSingle()
  if (!profile?.customer_id) return 'b2c'

  const { data: customer } = await supabase
    .from('customers')
    .select('customer_group, validated_at')
    .eq('id', profile.customer_id)
    .maybeSingle()
  if (!customer?.validated_at) return 'b2c'
  const group = customer.customer_group ?? 1
  return group >= 2 && group <= 4 ? 'b2b' : 'b2c'
}

export async function syncSubscriberToEsp(
  payload: Payload,
  subscriber: NewsletterSubscriberRow,
  listIdOverride?: number | null,
): Promise<void> {
  const supabase = getSupabaseServerClient()
  if (!supabase) {
    payload.logger.warn('[newsletter] Skipping ESP sync — Supabase not configured')
    return
  }

  const esp = createNewsletterEspPort(payload, listIdOverride)
  const segment = await resolveSegment(subscriber.web_profile_id)

  try {
    const { contactId } = await esp.upsertContact({
      email: subscriber.email_normalized,
      attributes: { source: subscriber.source, segment },
    })
    await markEspSynced(supabase, subscriber.id, contactId)
  } catch (err) {
    payload.logger.error({ msg: 'Newsletter ESP upsert failed', err, subscriberId: subscriber.id })
  }
}

export async function removeSubscriberFromEsp(
  payload: Payload,
  subscriber: NewsletterSubscriberRow,
  listIdOverride?: number | null,
): Promise<void> {
  const supabase = getSupabaseServerClient()
  if (!supabase) return

  const esp = createNewsletterEspPort(payload, listIdOverride)
  try {
    await esp.removeContact({ email: subscriber.email_normalized })
    await markEspSynced(supabase, subscriber.id, null)
  } catch (err) {
    payload.logger.error({ msg: 'Newsletter ESP remove failed', err, subscriberId: subscriber.id })
  }
}
