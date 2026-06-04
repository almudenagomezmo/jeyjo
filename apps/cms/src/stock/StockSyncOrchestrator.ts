import {
  StockIntegrationError,
  type StockSnapshotDto,
} from '@jeyjo/stock-ports'
import { createLocalReq, type Payload, type PayloadRequest } from 'payload'

import { getStockSourceReaders } from '@/stock/registry'
import { recalculateStockIndicatorsForAllProducts } from '@/stock/recalculateIndicators'
import { getSupabaseServerClient, writeAuditLog } from '@/lib/supabase-server'
import type { Product } from '@/payload-types'

export type StockSyncOrchestratorResult = {
  productsUpdated: number
  indicatorsUpdated: number
  syncRunId: string | null
  status: 'success' | 'partial' | 'failed'
  distrisantiagoStatus: 'success' | 'failed' | 'skipped'
  arnoiaStatus: 'success' | 'failed' | 'skipped'
  errors: string[]
}

export async function runStockSync({
  payload,
  req,
  actorName,
}: {
  payload: Payload
  req?: PayloadRequest
  actorName?: string | null
}): Promise<StockSyncOrchestratorResult> {
  const supabase = getSupabaseServerClient()
  const startedAt = new Date().toISOString()

  let syncRunId: string | null = null
  if (supabase) {
    const { data, error } = await supabase
      .from('stock_sync_runs')
      .insert({
        started_at: startedAt,
        status: 'failed',
        products_updated: 0,
        distrisantiago_status: 'pending',
        arnoia_status: 'pending',
      })
      .select('id')
      .single()
    if (!error && data) syncRunId = data.id
  }

  const syncReq = req
    ? (() => {
        req.context = { ...req.context, stockSync: true }
        return req
      })()
    : await (async () => {
        const localReq = await createLocalReq({}, payload)
        localReq.context = { ...localReq.context, stockSync: true }
        return localReq
      })()

  const errors: string[] = []
  let distrisantiagoStatus: StockSyncOrchestratorResult['distrisantiagoStatus'] = 'skipped'
  let arnoiaStatus: StockSyncOrchestratorResult['arnoiaStatus'] = 'skipped'
  let productsUpdated = 0
  let staleDistrisantiago = false
  let staleArnoia = false

  const distriSnapshots = new Map<string, StockSnapshotDto>()
  const arnoiaSnapshots = new Map<string, StockSnapshotDto>()

  try {
    const readers = getStockSourceReaders()

    try {
      let cursor: string | null = null
      do {
        const page = await readers.distrisantiago.listStockSnapshots({
          limit: 100,
          cursor,
        })
        for (const row of page.items) {
          distriSnapshots.set(row.wholesaleRef, row)
        }
        cursor = page.hasMore ? page.nextCursor : null
      } while (cursor)
      distrisantiagoStatus = 'success'
    } catch (e) {
      distrisantiagoStatus = 'failed'
      staleDistrisantiago = true
      errors.push(`distrisantiago: ${formatError(e)}`)
    }

    try {
      let cursor: string | null = null
      do {
        const page = await readers.arnoia.listStockSnapshots({ limit: 100, cursor })
        for (const row of page.items) {
          arnoiaSnapshots.set(row.wholesaleRef, row)
        }
        cursor = page.hasMore ? page.nextCursor : null
      } while (cursor)
      arnoiaStatus = 'success'
    } catch (e) {
      arnoiaStatus = 'failed'
      staleArnoia = true
      errors.push(`arnoia: ${formatError(e)}`)
    }

    if (distriSnapshots.size > 0 || arnoiaSnapshots.size > 0) {
      productsUpdated = await applyWholesaleSnapshots({
        payload,
        req: syncReq,
        distriSnapshots,
        arnoiaSnapshots,
        distriOk: distrisantiagoStatus === 'success',
        arnoiaOk: arnoiaStatus === 'success',
      })
    }

    const indicatorResult = await recalculateStockIndicatorsForAllProducts({
      payload,
      req: syncReq,
      staleDistrisantiago,
      staleArnoia,
    })
    errors.push(...indicatorResult.errors)

    const status: StockSyncOrchestratorResult['status'] =
      errors.length > 0
        ? productsUpdated > 0 || indicatorResult.productsUpdated > 0
          ? 'partial'
          : 'failed'
        : 'success'

    const result: StockSyncOrchestratorResult = {
      productsUpdated,
      indicatorsUpdated: indicatorResult.productsUpdated,
      syncRunId,
      status,
      distrisantiagoStatus,
      arnoiaStatus,
      errors,
    }

    await finalizeStockSyncRun({
      syncRunId,
      result,
      actorName,
      fatalError: null,
    })

    return result
  } catch (e) {
    const message = formatError(e)
    const isStockOutage =
      e instanceof StockIntegrationError &&
      (e.code === 'STOCK_UNAVAILABLE' || e.code === 'STOCK_TIMEOUT')

    const result: StockSyncOrchestratorResult = {
      productsUpdated: 0,
      indicatorsUpdated: 0,
      syncRunId,
      status: 'failed',
      distrisantiagoStatus,
      arnoiaStatus,
      errors: [message],
    }

    await finalizeStockSyncRun({
      syncRunId,
      result,
      actorName,
      fatalError: message,
      auditStatus: isStockOutage ? 'error_stock' : 'error_stock',
    })

    throw e
  }
}

async function applyWholesaleSnapshots({
  payload,
  req,
  distriSnapshots,
  arnoiaSnapshots,
  distriOk,
  arnoiaOk,
}: {
  payload: Payload
  req: PayloadRequest
  distriSnapshots: Map<string, StockSnapshotDto>
  arnoiaSnapshots: Map<string, StockSnapshotDto>
  distriOk: boolean
  arnoiaOk: boolean
}): Promise<number> {
  let updated = 0
  const now = new Date().toISOString()
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
      const product = doc as Product
      if (!product.skuErp || !product.id) continue

      const matchRef =
        (product.mainWholesaleRef?.trim() || product.skuErp.trim()) || product.skuErp
      const patch: Partial<Product> = {}
      let touched = false

      if (distriOk) {
        const snap = distriSnapshots.get(matchRef)
        if (snap) {
          patch.distrisantiagoStock = snap.quantity
          patch.syncDistrisantiagoAt = now
          touched = true
        }
      }

      if (arnoiaOk) {
        const snap = arnoiaSnapshots.get(matchRef)
        if (snap) {
          patch.arnoiaStock = snap.quantity
          patch.syncArnoiaAt = now
          touched = true
        }
      }

      if (!touched) continue

      await payload.update({
        collection: 'products',
        id: product.id,
        data: patch,
        overrideAccess: true,
        req,
      })
      updated += 1
    }

    if (!batch.hasNextPage) break
    page += 1
  } while (true)

  return updated
}

async function finalizeStockSyncRun({
  syncRunId,
  result,
  actorName,
  fatalError,
  auditStatus,
}: {
  syncRunId: string | null
  result: StockSyncOrchestratorResult
  actorName?: string | null
  fatalError: string | null
  auditStatus?: string
}): Promise<void> {
  const finishedAt = new Date().toISOString()
  const errorSummary =
    fatalError ?? (result.errors.length > 0 ? result.errors.slice(0, 5).join('; ') : null)

  const supabase = getSupabaseServerClient()
  if (supabase && syncRunId) {
    await supabase
      .from('stock_sync_runs')
      .update({
        finished_at: finishedAt,
        status: result.status,
        products_updated: result.productsUpdated,
        distrisantiago_status: result.distrisantiagoStatus,
        arnoia_status: result.arnoiaStatus,
        error_summary: errorSummary,
      })
      .eq('id', syncRunId)
  }

  await writeAuditLog({
    actorName: actorName ?? 'system',
    entityType: 'stock_sync',
    entityId: syncRunId,
    action: 'SYNC_STOCK_READ',
    metadata: {
      status: auditStatus ?? result.status,
      productsUpdated: result.productsUpdated,
      indicatorsUpdated: result.indicatorsUpdated,
      distrisantiagoStatus: result.distrisantiagoStatus,
      arnoiaStatus: result.arnoiaStatus,
      errors: result.errors,
      errorSummary,
    },
  })
}

function formatError(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}
