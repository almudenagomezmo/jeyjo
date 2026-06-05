import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@jeyjo/database-types'

import { createNewsletterToken } from './tokens'
import type { NewsletterSource, NewsletterStatus, NewsletterSubscriberRow } from './types'

function asSubscriberRow(row: Record<string, unknown>): NewsletterSubscriberRow {
  return row as NewsletterSubscriberRow
}

export function normalizeNewsletterEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isValidNewsletterEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

type Db = SupabaseClient<Database>

export async function getSubscriberByNormalizedEmail(
  supabase: Db,
  emailNormalized: string,
): Promise<NewsletterSubscriberRow | null> {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .eq('email_normalized', emailNormalized)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? asSubscriberRow(data as Record<string, unknown>) : null
}

export async function getSubscriberByConfirmToken(
  supabase: Db,
  token: string,
): Promise<NewsletterSubscriberRow | null> {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .eq('confirm_token', token)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? asSubscriberRow(data as Record<string, unknown>) : null
}

export async function getSubscriberByUnsubscribeToken(
  supabase: Db,
  token: string,
): Promise<NewsletterSubscriberRow | null> {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .eq('unsubscribe_token', token)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? asSubscriberRow(data as Record<string, unknown>) : null
}

export async function getSubscriberById(supabase: Db, id: string): Promise<NewsletterSubscriberRow | null> {
  const { data, error } = await supabase.from('newsletter_subscribers').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? asSubscriberRow(data as Record<string, unknown>) : null
}

export async function upsertPendingSubscriber(
  supabase: Db,
  input: {
    email: string
    source: NewsletterSource
    webProfileId?: string | null
  },
): Promise<NewsletterSubscriberRow> {
  const emailNormalized = normalizeNewsletterEmail(input.email)
  const now = new Date().toISOString()
  const existing = await getSubscriberByNormalizedEmail(supabase, emailNormalized)

  if (existing?.status === 'confirmed') {
    return existing
  }

  const row = {
    email: input.email.trim(),
    email_normalized: emailNormalized,
    status: 'pending' as NewsletterStatus,
    confirm_token: createNewsletterToken(),
    unsubscribe_token: existing?.unsubscribe_token ?? createNewsletterToken(),
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
      .update(row)
      .eq('id', existing.id)
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    return asSubscriberRow(data as Record<string, unknown>)
  }

  const { data, error } = await supabase.from('newsletter_subscribers').insert(row).select('*').single()
  if (error) throw new Error(error.message)
  return asSubscriberRow(data as Record<string, unknown>)
}

export async function confirmSubscriber(supabase: Db, id: string): Promise<NewsletterSubscriberRow> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .update({ status: 'confirmed', confirmed_at: now, updated_at: now })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return asSubscriberRow(data as Record<string, unknown>)
}

export async function unsubscribeSubscriber(supabase: Db, id: string): Promise<NewsletterSubscriberRow> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .update({ status: 'unsubscribed', unsubscribed_at: now, updated_at: now })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return asSubscriberRow(data as Record<string, unknown>)
}

export async function markEspSynced(
  supabase: Db,
  id: string,
  contactId: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({
      esp_contact_id: contactId,
      esp_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export type SubscriberListQuery = {
  status?: NewsletterStatus
  from?: string
  to?: string
  page?: number
  limit?: number
}

export async function listSubscribers(supabase: Db, query: SubscriberListQuery) {
  const page = query.page ?? 1
  const limit = Math.min(query.limit ?? 50, 200)
  const from = (page - 1) * limit
  const to = from + limit - 1

  let q = supabase.from('newsletter_subscribers').select('*', { count: 'exact' })
  if (query.status) q = q.eq('status', query.status)
  if (query.from) q = q.gte('created_at', query.from)
  if (query.to) q = q.lte('created_at', query.to)

  const { data, error, count } = await q.order('created_at', { ascending: false }).range(from, to)
  if (error) throw new Error(error.message)
  return { docs: (data ?? []).map((row) => asSubscriberRow(row as Record<string, unknown>)), totalDocs: count ?? 0, page, limit }
}

export async function listSubscribersForExport(supabase: Db, query: SubscriberListQuery) {
  let q = supabase.from('newsletter_subscribers').select('*')
  if (query.status) q = q.eq('status', query.status)
  if (query.from) q = q.gte('created_at', query.from)
  if (query.to) q = q.lte('created_at', query.to)
  const { data, error } = await q.order('created_at', { ascending: false }).limit(5000)
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => asSubscriberRow(row as Record<string, unknown>))
}

export async function rotateConfirmToken(supabase: Db, id: string): Promise<NewsletterSubscriberRow> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .update({ confirm_token: createNewsletterToken(), updated_at: now })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return asSubscriberRow(data as Record<string, unknown>)
}
