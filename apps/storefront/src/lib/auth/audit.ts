import type { Json } from '@jeyjo/database-types'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export async function writeCustomerLoginAudit(input: {
  userId: string
  customerId: string
  email: string
  sourceIp?: string | null
}): Promise<void> {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return

  const metadata = {
    email: input.email,
    customerId: input.customerId,
    loggedAt: new Date().toISOString(),
  } satisfies Record<string, string>

  await supabase.from('audit_log').insert({
    actor_user_id: input.userId,
    actor_name: input.email,
    action: 'CUSTOMER_LOGIN',
    entity_type: 'customer',
    entity_id: input.customerId,
    new_value: metadata as Json,
    source_ip: input.sourceIp ?? null,
  })
}

export async function writeSubuserAudit(input: {
  actorUserId: string
  actorEmail: string
  action: 'SUBUSER_CREATED' | 'SUBUSER_UPDATED' | 'SUBUSER_DEACTIVATED'
  subuserId: string
  customerId: string
  metadata?: Record<string, unknown>
  sourceIp?: string | null
}): Promise<void> {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return

  await supabase.from('audit_log').insert({
    actor_user_id: input.actorUserId,
    actor_name: input.actorEmail,
    action: input.action,
    entity_type: 'web_profile',
    entity_id: input.subuserId,
    new_value: {
      customerId: input.customerId,
      ...(input.metadata ?? {}),
    } as Json,
    source_ip: input.sourceIp ?? null,
  })
}
