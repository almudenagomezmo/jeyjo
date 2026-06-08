import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { getSupabaseServerClient } from '@/lib/supabase-server'

function toDateKey(value: unknown): string {
  if (!value) return new Date().toISOString().slice(0, 10)
  if (typeof value === 'string') return value.slice(0, 10)
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return new Date().toISOString().slice(0, 10)
}

export const mirrorSpecialPriceToSupabase: CollectionAfterChangeHook = async ({ doc, req }) => {
  const supabase = getSupabaseServerClient()
  if (!supabase) return doc

  const row = {
    customer_id: String(doc.customerId),
    product_sku: String(doc.productSku),
    net_price: Number(doc.netPrice),
    valid_from: toDateKey(doc.validFrom),
    valid_to: doc.validTo ? toDateKey(doc.validTo) : null,
  }

  if (doc.supabaseId) {
    await supabase.from('special_prices').update(row).eq('id', doc.supabaseId)
    return doc
  }

  const { data, error } = await supabase
    .from('special_prices')
    .upsert(row, { onConflict: 'customer_id,product_sku' })
    .select('id')
    .single()

  if (error) {
    req.payload.logger.error({ err: error, message: 'special_prices mirror failed' })
    return doc
  }

  if (data?.id) {
    await req.payload.update({
      collection: 'special-prices',
      id: doc.id,
      data: { supabaseId: data.id },
      overrideAccess: true,
      req,
    })
  }

  return doc
}

export const removeSpecialPriceFromSupabase: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const supabase = getSupabaseServerClient()
  if (!supabase) return doc

  if (doc.supabaseId) {
    await supabase.from('special_prices').delete().eq('id', doc.supabaseId)
    return doc
  }

  await supabase
    .from('special_prices')
    .delete()
    .eq('customer_id', String(doc.customerId))
    .eq('product_sku', String(doc.productSku))

  return doc
}
