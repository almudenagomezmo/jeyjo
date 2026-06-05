import { randomUUID } from 'node:crypto'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@jeyjo/database-types'

import type { NewsletterSource } from './types'

type Db = SupabaseClient<Database>

export type NewsletterSubscriber = Database['public']['Tables']['newsletter_subscribers']['Row']

export function normalizeNewsletterEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isValidNewsletterEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function createToken(): string {
  return randomUUID()
}

export function isConfirmTokenExpired(updatedAt: string, now = Date.now()): boolean {
  const updated = new Date(updatedAt).getTime()
  return now - updated > 7 * 24 * 60 * 60 * 1000
}

export async function getSubscriberByConfirmToken(supabase: Db, token: string) {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .eq('confirm_token', token)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function getSubscriberByUnsubscribeToken(supabase: Db, token: string) {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .eq('unsubscribe_token', token)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function upsertPendingSubscriber(
  supabase: Db,
  input: { email: string; source: NewsletterSource; webProfileId?: string | null },
): Promise<{ row: NewsletterSubscriber; createdOrReset: boolean }> {
  const emailNormalized = normalizeNewsletterEmail(input.email)
  const now = new Date().toISOString()

  const { data: existing, error: findError } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .eq('email_normalized', emailNormalized)
    .maybeSingle()
  if (findError) throw new Error(findError.message)

  if (existing?.status === 'confirmed') {
    return { row: existing, createdOrReset: false }
  }

  const patch = {
    email: input.email.trim(),
    email_normalized: emailNormalized,
    status: 'pending' as const,
    confirm_token: createToken(),
    unsubscribe_token: existing?.unsubscribe_token ?? createToken(),
    consent_at: now,
    confirmed_at: null,
    unsubscribed_at: null,
    source: input.source,
    web_profile_id: input.webProfileId ?? null,
    updated_at: now,
  }

  if (existing) {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .update(patch)
      .eq('id', existing.id)
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    return { row: data, createdOrReset: true }
  }

  const { data, error } = await supabase.from('newsletter_subscribers').insert(patch).select('*').single()
  if (error) throw new Error(error.message)
  return { row: data, createdOrReset: true }
}

export async function confirmSubscriber(supabase: Db, id: string) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .update({ status: 'confirmed', confirmed_at: now, updated_at: now })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function unsubscribeSubscriber(supabase: Db, id: string) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .update({ status: 'unsubscribed', unsubscribed_at: now, updated_at: now })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data
}
