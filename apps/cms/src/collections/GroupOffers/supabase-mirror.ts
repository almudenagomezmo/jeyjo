import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { getSupabaseServerClient } from '@/lib/supabase-server'

function toDateKey(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') return value.slice(0, 10)
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return null
}

export const mirrorGroupOfferToSupabase: CollectionAfterChangeHook = async ({ doc, req }) => {
  const supabase = getSupabaseServerClient()
  if (!supabase) return doc

  const groupRaw = doc.customerGroup
  const customerGroup =
    groupRaw === '' || groupRaw == null ? null : Number.parseInt(String(groupRaw), 10)

  const row = {
    sku_erp: String(doc.productSku),
    offer_net_price: Number(doc.offerNetPrice),
    customer_group: Number.isFinite(customerGroup) ? customerGroup : null,
    valid_from: toDateKey(doc.validFrom) ?? new Date().toISOString().slice(0, 10),
    valid_to: toDateKey(doc.validTo),
    active: doc.active !== false,
  }

  if (doc.supabaseId) {
    await supabase.from('group_offers').update(row).eq('id', doc.supabaseId)
    return doc
  }

  const { data, error } = await supabase.from('group_offers').insert(row).select('id').single()

  if (error) {
    req.payload.logger.error({ err: error, message: 'group_offers mirror failed' })
    return doc
  }

  if (data?.id) {
    await req.payload.update({
      collection: 'group-offers',
      id: doc.id,
      data: { supabaseId: data.id },
      overrideAccess: true,
      req,
    })
  }

  return doc
}

export const removeGroupOfferFromSupabase: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const supabase = getSupabaseServerClient()
  if (!supabase) return doc

  if (doc.supabaseId) {
    await supabase.from('group_offers').delete().eq('id', doc.supabaseId)
  }

  return doc
}
