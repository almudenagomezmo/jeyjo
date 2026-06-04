import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database, Json } from '@jeyjo/database-types'

import { payloadIdToUuid } from '@/lib/entity-uuid'

export type SearchEntityType = 'producto' | 'categoria'
export type SearchEventAction = 'create' | 'update' | 'delete'

export type EnqueueSearchEventInput = {
  entityType: SearchEntityType
  entityId: string | number
  action: SearchEventAction
  payload?: Record<string, unknown>
}

export type WriteAuditLogInput = {
  actorId?: string | number | null
  actorName?: string | null
  entityType: string
  entityId?: string | number | null
  action: string
  metadata?: Record<string, unknown> | null
  previousValue?: Record<string, unknown> | null
}

let client: SupabaseClient<Database> | null = null

export function getSupabaseServerClient(): SupabaseClient<Database> | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return null
  }

  if (!client) {
    client = createClient<Database>(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  return client
}

function mapSearchAction(action: SearchEventAction): Database['public']['Tables']['search_events']['Insert']['action'] {
  return action === 'delete' ? 'delete' : 'upsert'
}

export async function enqueueSearchEvent(input: EnqueueSearchEventInput): Promise<void> {
  const supabase = getSupabaseServerClient()
  if (!supabase) {
    console.warn('[supabase-server] Skipping search event — SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing')
    return
  }

  const row: Database['public']['Tables']['search_events']['Insert'] = {
    entity_type: input.entityType,
    entity_id: payloadIdToUuid(input.entityType, input.entityId),
    action: mapSearchAction(input.action),
    payload: (input.payload ?? {}) as Json,
    status: 'pending',
  }

  const { error } = await supabase.from('search_events').insert(row)

  if (error) {
    throw new Error(`search_events insert failed: ${error.message}`)
  }
}

export async function writeAuditLog(input: WriteAuditLogInput): Promise<void> {
  const supabase = getSupabaseServerClient()
  if (!supabase) {
    console.warn('[supabase-server] Skipping audit log — SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing')
    return
  }

  const actorUserId =
    input.actorId != null ? payloadIdToUuid('payload-user', input.actorId) : null

  const entityId =
    input.entityId != null ? payloadIdToUuid(input.entityType, input.entityId) : null

  const row: Database['public']['Tables']['audit_log']['Insert'] = {
    actor_user_id: actorUserId,
    actor_name: input.actorName ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: entityId,
    new_value: (input.metadata ?? null) as Json,
    previous_value: (input.previousValue ?? null) as Json,
  }

  const { error } = await supabase.from('audit_log').insert(row)

  if (error) {
    throw new Error(`audit_log insert failed: ${error.message}`)
  }
}
