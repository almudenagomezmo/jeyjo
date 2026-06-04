import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@jeyjo/database-types'

import { getSupabaseServiceRoleKey, getSupabaseUrl } from './env'

let adminClient: SupabaseClient<Database> | null = null

export function getSupabaseAdminClient(): SupabaseClient<Database> | null {
  const url = getSupabaseUrl()
  const key = getSupabaseServiceRoleKey()
  if (!url || !key) return null

  if (!adminClient) {
    adminClient = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return adminClient
}
