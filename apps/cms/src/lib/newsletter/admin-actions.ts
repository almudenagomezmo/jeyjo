import type { Payload } from 'payload'

import { getSubscriberById, rotateConfirmToken } from './repository'
import { sendNewsletterConfirmationEmail } from './send-confirmation'
import { syncSubscriberToEsp } from './sync-esp'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function resendNewsletterConfirmation(payload: Payload, subscriberId: string): Promise<boolean> {
  const supabase = getSupabaseServerClient()
  if (!supabase) return false

  const row = await getSubscriberById(supabase, subscriberId)
  if (!row || row.status !== 'pending') return false

  const updated = await rotateConfirmToken(supabase, row.id)
  return sendNewsletterConfirmationEmail(payload, updated)
}

export async function manualEspResync(
  payload: Payload,
  subscriberId: string,
  listIdOverride?: number | null,
): Promise<boolean> {
  const supabase = getSupabaseServerClient()
  if (!supabase) return false

  const row = await getSubscriberById(supabase, subscriberId)
  if (!row || row.status !== 'confirmed') return false

  await syncSubscriberToEsp(payload, row, listIdOverride)
  return true
}
