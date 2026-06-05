import type { Payload } from 'payload'

import { enqueueSearchEvent } from '@/lib/supabase-server'

export async function enqueueSearchEventsForSkus(payload: Payload, skus: string[]): Promise<void> {
  const unique = [...new Set(skus)]
  for (const sku of unique) {
    const found = await payload.find({
      collection: 'products',
      where: { skuErp: { equals: sku } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const product = found.docs[0]
    if (!product) continue

    try {
      await enqueueSearchEvent({
        entityType: 'producto',
        entityId: product.id,
        action: 'update',
        payload: { skuErp: sku, source: 'excel_import' },
      })
    } catch (e) {
      console.warn(`[catalog-import] search_events enqueue failed for ${sku}:`, e)
    }
  }
}
