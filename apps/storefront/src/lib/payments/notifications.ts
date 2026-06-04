import type { Json } from '@jeyjo/database-types'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export async function insertPaymentNotification(input: {
  orderReference: string
  signature: string
  gateway?: string
  responseCode?: string | null
  rawParameters: Json
}): Promise<'inserted' | 'duplicate'> {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return 'duplicate'

  const { error } = await supabase.from('payment_notifications').insert({
    order_reference: input.orderReference,
    signature: input.signature,
    gateway: input.gateway ?? 'redsys',
    response_code: input.responseCode ?? null,
    raw_parameters: input.rawParameters,
  })

  if (error?.code === '23505') return 'duplicate'
  if (error) throw error
  return 'inserted'
}
