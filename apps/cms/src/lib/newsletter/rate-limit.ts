import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@jeyjo/database-types'

const WINDOW_MS = 60 * 60 * 1000
const MAX_HITS = 5

type Db = SupabaseClient<Database>

export function buildRateLimitKey(ip: string, emailNormalized: string): string {
  return `${ip}:${emailNormalized}`
}

export async function isNewsletterRateLimited(supabase: Db, bucketKey: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('newsletter_rate_limits')
    .select('hit_count, window_started_at')
    .eq('bucket_key', bucketKey)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return false

  const windowStart = new Date(data.window_started_at).getTime()
  if (Date.now() - windowStart > WINDOW_MS) return false
  return data.hit_count >= MAX_HITS
}

export async function recordNewsletterRateHit(supabase: Db, bucketKey: string): Promise<void> {
  const { data, error } = await supabase
    .from('newsletter_rate_limits')
    .select('hit_count, window_started_at')
    .eq('bucket_key', bucketKey)
    .maybeSingle()

  if (error) throw new Error(error.message)
  const now = new Date().toISOString()

  if (!data || Date.now() - new Date(data.window_started_at).getTime() > WINDOW_MS) {
    const { error: upsertError } = await supabase.from('newsletter_rate_limits').upsert({
      bucket_key: bucketKey,
      hit_count: 1,
      window_started_at: now,
    })
    if (upsertError) throw new Error(upsertError.message)
    return
  }

  const { error: updateError } = await supabase
    .from('newsletter_rate_limits')
    .update({ hit_count: data.hit_count + 1 })
    .eq('bucket_key', bucketKey)
  if (updateError) throw new Error(updateError.message)
}
