import type { Json } from '@jeyjo/database-types'

import { getSupabaseServerClient } from '@/lib/supabase-server'

import type { SearchEventPayload, SearchEventRow } from './types'

const STALE_PROCESSING_MS = 10 * 60 * 1000
const MAX_INDEX_ATTEMPTS = 3
const DEFAULT_BATCH_SIZE = 50

function parsePayload(payload: Json): SearchEventPayload {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload as SearchEventPayload
  }
  return {}
}

export async function resetStaleProcessingEvents(): Promise<number> {
  const supabase = getSupabaseServerClient()
  if (!supabase) return 0

  const cutoff = new Date(Date.now() - STALE_PROCESSING_MS).toISOString()
  const { data, error } = await supabase
    .from('search_events')
    .update({ status: 'pending' })
    .eq('status', 'processing')
    .is('processed_at', null)
    .lt('created_at', cutoff)
    .select('id')

  if (error) {
    throw new Error(`search_events stale reset failed: ${error.message}`)
  }

  return data?.length ?? 0
}

export async function claimSearchEvents(batchSize = DEFAULT_BATCH_SIZE): Promise<SearchEventRow[]> {
  const supabase = getSupabaseServerClient()
  if (!supabase) return []

  await resetStaleProcessingEvents()

  const { data: pending, error: selectError } = await supabase
    .from('search_events')
    .select('id')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(batchSize)

  if (selectError) {
    throw new Error(`search_events claim select failed: ${selectError.message}`)
  }

  if (!pending?.length) return []

  const ids = pending.map((row) => row.id)
  const { data: claimed, error: updateError } = await supabase
    .from('search_events')
    .update({ status: 'processing' })
    .in('id', ids)
    .eq('status', 'pending')
    .select('*')

  if (updateError) {
    throw new Error(`search_events claim update failed: ${updateError.message}`)
  }

  return claimed ?? []
}

export async function completeSearchEvent(id: string): Promise<void> {
  const supabase = getSupabaseServerClient()
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { error } = await supabase
    .from('search_events')
    .update({
      status: 'done',
      processed_at: new Date().toISOString(),
      error_message: null,
    })
    .eq('id', id)

  if (error) {
    throw new Error(`search_events complete failed: ${error.message}`)
  }
}

function truncateError(message: string, max = 500): string {
  return message.length <= max ? message : `${message.slice(0, max - 3)}...`
}

export async function failSearchEvent(
  event: SearchEventRow,
  errorMessage: string,
): Promise<'error' | 'pending'> {
  const supabase = getSupabaseServerClient()
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const payload = parsePayload(event.payload)
  const attempts = (payload._indexAttempts ?? 0) + 1
  const nextPayload: SearchEventPayload = { ...payload, _indexAttempts: attempts }

  if (attempts >= MAX_INDEX_ATTEMPTS) {
    const { error } = await supabase
      .from('search_events')
      .update({
        status: 'error',
        error_message: truncateError(errorMessage),
        processed_at: new Date().toISOString(),
        payload: nextPayload as Json,
      })
      .eq('id', event.id)

    if (error) {
      throw new Error(`search_events fail failed: ${error.message}`)
    }
    return 'error'
  }

  const { error } = await supabase
    .from('search_events')
    .update({
      status: 'pending',
      error_message: truncateError(errorMessage),
      payload: nextPayload as Json,
    })
    .eq('id', event.id)

  if (error) {
    throw new Error(`search_events retry failed: ${error.message}`)
  }
  return 'pending'
}

export function eventPayload(event: SearchEventRow): SearchEventPayload {
  return parsePayload(event.payload)
}
