import {
  parseStockLowThreshold,
  resolveStockIndicator,
  type StockIndicatorLevel,
} from '@jeyjo/stock-ports'
import { createLocalReq, type Payload, type PayloadRequest } from 'payload'

import type { Product } from '@/payload-types'

export type RecalculateIndicatorsResult = {
  productsUpdated: number
  errors: string[]
}

function stockThreshold(): number {
  return parseStockLowThreshold(process.env.STOCK_LOW_THRESHOLD)
}

export async function recalculateStockIndicatorsForSkus({
  payload,
  req,
  skus,
  staleDistrisantiago = false,
  staleArnoia = false,
}: {
  payload: Payload
  req?: PayloadRequest
  skus: string[]
  staleDistrisantiago?: boolean
  staleArnoia?: boolean
}): Promise<RecalculateIndicatorsResult> {
  const result: RecalculateIndicatorsResult = { productsUpdated: 0, errors: [] }
  const unique = [...new Set(skus.filter(Boolean))]
  if (unique.length === 0) return result

  const syncReq = await stockSyncReq(payload, req)
  const threshold = stockThreshold()

  for (const sku of unique) {
    try {
      const found = await payload.find({
        collection: 'products',
        where: { skuErp: { equals: sku } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
        req: syncReq,
      })
      const doc = found.docs[0] as Product | undefined
      if (!doc?.id) continue

      const indicator = resolveStockIndicator({
        erpStock: doc.erpStock ?? null,
        distrisantiagoStock: doc.distrisantiagoStock ?? null,
        arnoiaStock: doc.arnoiaStock ?? null,
        threshold,
        staleDistrisantiago,
        staleArnoia,
      })

      await payload.update({
        collection: 'products',
        id: doc.id,
        data: { stockIndicator: indicator.level as StockIndicatorLevel },
        overrideAccess: true,
        req: syncReq,
      })
      result.productsUpdated += 1
    } catch (e) {
      result.errors.push(`${sku}: ${formatError(e)}`)
    }
  }

  return result
}

export async function recalculateStockIndicatorsForAllProducts({
  payload,
  req,
  staleDistrisantiago = false,
  staleArnoia = false,
}: {
  payload: Payload
  req?: PayloadRequest
  staleDistrisantiago?: boolean
  staleArnoia?: boolean
}): Promise<RecalculateIndicatorsResult> {
  const skus: string[] = []
  let page = 1
  const limit = 100

  do {
    const batch = await payload.find({
      collection: 'products',
      where: { skuErp: { exists: true } },
      limit,
      page,
      depth: 0,
      overrideAccess: true,
      req,
    })
    for (const doc of batch.docs) {
      if (doc.skuErp) skus.push(doc.skuErp)
    }
    if (!batch.hasNextPage) break
    page += 1
  } while (true)

  return recalculateStockIndicatorsForSkus({
    payload,
    req,
    skus,
    staleDistrisantiago,
    staleArnoia,
  })
}

async function stockSyncReq(
  payload: Payload,
  req?: PayloadRequest,
): Promise<PayloadRequest> {
  if (req) {
    req.context = { ...req.context, stockSync: true }
    return req
  }
  const syncReq = await createLocalReq({}, payload)
  syncReq.context = { ...syncReq.context, stockSync: true }
  return syncReq
}

function formatError(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}
