import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@jeyjo/database-types'

import { getSupabaseServerClient } from '@/lib/supabase-server'

export type SearchQueueStats = {
  pending: number
  processing: number
  error: number
  oldestPendingAgeSec: number
}

async function countByStatus(
  supabase: SupabaseClient<Database>,
  status: 'pending' | 'processing' | 'error',
): Promise<number> {
  const { count, error } = await supabase
    .from('search_events')
    .select('id', { count: 'exact', head: true })
    .eq('status', status)

  if (error) {
    throw new Error(`search_events count failed (${status}): ${error.message}`)
  }

  return count ?? 0
}

export async function getSearchQueueStats(
  supabaseClient: SupabaseClient<Database> | null = getSupabaseServerClient(),
): Promise<SearchQueueStats> {
  if (!supabaseClient) {
    return { pending: 0, processing: 0, error: 0, oldestPendingAgeSec: 0 }
  }

  const [pending, processing, error] = await Promise.all([
    countByStatus(supabaseClient, 'pending'),
    countByStatus(supabaseClient, 'processing'),
    countByStatus(supabaseClient, 'error'),
  ])

  let oldestPendingAgeSec = 0
  if (pending > 0) {
    const { data, error: oldestError } = await supabaseClient
      .from('search_events')
      .select('created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (oldestError) {
      throw new Error(`search_events oldest pending failed: ${oldestError.message}`)
    }

    if (data?.created_at) {
      oldestPendingAgeSec = Math.max(
        0,
        Math.floor((Date.now() - new Date(data.created_at).getTime()) / 1000),
      )
    }
  }

  return { pending, processing, error, oldestPendingAgeSec }
}
