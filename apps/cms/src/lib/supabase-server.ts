import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database, Json } from '@jeyjo/database-types'

import { payloadIdToUuid } from '@/lib/entity-uuid'
import { extractSourceIp } from '@/lib/request-ip'

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
  sourceIp?: string | null
}

export type SecurityAuditAction =
  | 'ACCESS_DENIED'
  | 'LOGIN_FAILED'
  | 'MFA_ENROLLED'
  | 'MFA_RESET'
  | 'ROLE_CHANGED'
  | 'PASSWORD_CHANGED'

export type WriteSecurityAuditInput = {
  action: SecurityAuditAction
  actorId?: string | number | null
  actorName?: string | null
  entityId?: string | number | null
  metadata?: Record<string, unknown> | null
  previousValue?: Record<string, unknown> | null
  sourceIp?: string | null
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
    source_ip: input.sourceIp ?? null,
  }

  const { error } = await supabase.from('audit_log').insert(row)

  if (error) {
    throw new Error(`audit_log insert failed: ${error.message}`)
  }
}

export async function writeSecurityAudit(input: WriteSecurityAuditInput): Promise<void> {
  await writeAuditLog({
    actorId: input.actorId,
    actorName: input.actorName,
    entityType: 'security',
    entityId: input.entityId,
    action: input.action,
    metadata: input.metadata ?? null,
    previousValue: input.previousValue ?? null,
    sourceIp: input.sourceIp ?? null,
  })
}

export function sourceIpFromHeaders(headers: Headers): string | null {
  return extractSourceIp(headers)
}

export type AuditLogQuery = {
  actor?: string
  entityType?: string
  action?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export async function queryAuditLog(query: AuditLogQuery) {
  const supabase = getSupabaseServerClient()
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const page = Math.max(1, query.page ?? 1)
  const limit = Math.min(100, Math.max(1, query.limit ?? 25))
  const from = (page - 1) * limit
  const to = from + limit - 1

  let builder = supabase
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (query.actor) {
    builder = builder.ilike('actor_name', `%${query.actor}%`)
  }
  if (query.entityType) {
    builder = builder.eq('entity_type', query.entityType)
  }
  if (query.action) {
    builder = builder.eq('action', query.action)
  }
  if (query.from) {
    builder = builder.gte('created_at', query.from)
  }
  if (query.to) {
    builder = builder.lte('created_at', query.to)
  }

  const { data, error, count } = await builder

  if (error) {
    throw new Error(`audit_log query failed: ${error.message}`)
  }

  return { docs: data ?? [], totalDocs: count ?? 0, page, limit }
}

export async function queryAuditLogForExport(query: Omit<AuditLogQuery, 'page' | 'limit'>, maxRows = 10_000) {
  const supabase = getSupabaseServerClient()
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  let builder = supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(maxRows)

  if (query.actor) builder = builder.ilike('actor_name', `%${query.actor}%`)
  if (query.entityType) builder = builder.eq('entity_type', query.entityType)
  if (query.action) builder = builder.eq('action', query.action)
  if (query.from) builder = builder.gte('created_at', query.from)
  if (query.to) builder = builder.lte('created_at', query.to)

  const { data, error } = await builder
  if (error) throw new Error(`audit_log export failed: ${error.message}`)
  return data ?? []
}

export { extractSourceIp }
