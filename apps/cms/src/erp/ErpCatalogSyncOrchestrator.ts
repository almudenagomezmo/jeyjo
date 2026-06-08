import { ErpIntegrationError } from '@jeyjo/erp-ports'
import type { Payload, PayloadRequest } from 'payload'

import { ErpCatalogSyncService, type ErpCatalogSyncResult } from '@/erp/ErpCatalogSyncService'
import { ErpPricingSyncService } from '@/erp/ErpPricingSyncService'
import { getErpAdapters } from '@/erp/registry'
import { recalculateStockIndicatorsForSkus } from '@/stock/recalculateIndicators'
import { isWebNativeMode } from '@/lib/web-native-mode'
import { getSupabaseServerClient, writeAuditLog } from '@/lib/supabase-server'

export type ErpSyncOrchestratorResult = ErpCatalogSyncResult & {
  pricingRowsUpserted: number
  syncRunId: string | null
  status: 'success' | 'partial' | 'failed'
}

export async function runCatalogSyncRead({
  payload,
  req,
  actorName,
}: {
  payload: Payload
  req?: PayloadRequest
  actorName?: string | null
}): Promise<ErpSyncOrchestratorResult> {
  if (await isWebNativeMode(payload)) {
    throw new ErpIntegrationError(
      'ERP_NOT_IMPLEMENTED',
      'ERP catalog sync disabled in web-native mode',
    )
  }

  const adapter = process.env.ERP_ADAPTER ?? 'stub'
  const supabase = getSupabaseServerClient()
  const startedAt = new Date().toISOString()

  let syncRunId: string | null = null
  if (supabase) {
    const { data, error } = await supabase
      .from('erp_sync_runs')
      .insert({
        adapter,
        started_at: startedAt,
        status: 'failed',
        products_updated: 0,
        suppliers_updated: 0,
        pricing_rows_upserted: 0,
      })
      .select('id')
      .single()
    if (!error && data) syncRunId = data.id
  }

  const empty: ErpSyncOrchestratorResult = {
    productsUpdated: 0,
    suppliersUpdated: 0,
    updatedSkus: [],
    pricingRowsUpserted: 0,
    errors: [],
    syncRunId,
    status: 'failed',
  }

  try {
    const { catalogReader, pricingReader } = getErpAdapters()
    const catalogService = new ErpCatalogSyncService(payload, catalogReader)
    const catalogResult = await catalogService.syncAllFromReader(req)

    let pricingRowsUpserted = 0
    const pricingErrors: string[] = []

    if (supabase) {
      const pricingService = new ErpPricingSyncService(supabase, pricingReader)
      const pricingResult = await pricingService.syncAllFromReader()
      pricingRowsUpserted = pricingResult.rowsUpserted
      pricingErrors.push(...pricingResult.errors)
    } else {
      pricingErrors.push('pricing sync skipped: Supabase not configured')
    }

    const errors = [...catalogResult.errors, ...pricingErrors]
    const status: ErpSyncOrchestratorResult['status'] =
      errors.length > 0
        ? catalogResult.productsUpdated + catalogResult.suppliersUpdated > 0 ||
            pricingRowsUpserted > 0
          ? 'partial'
          : 'failed'
        : 'success'

    const result: ErpSyncOrchestratorResult = {
      ...catalogResult,
      errors,
      pricingRowsUpserted,
      syncRunId,
      status,
    }

    if (catalogResult.updatedSkus.length > 0) {
      const indicatorResult = await recalculateStockIndicatorsForSkus({
        payload,
        req,
        skus: catalogResult.updatedSkus,
      })
      if (indicatorResult.errors.length > 0) {
        result.errors.push(...indicatorResult.errors)
      }
    }

    await finalizeSyncRun({
      syncRunId,
      adapter,
      result,
      fatalError: null,
      actorName,
    })

    return result
  } catch (e) {
    const message = formatError(e)
    const isErpOutage =
      e instanceof ErpIntegrationError &&
      (e.code === 'ERP_UNAVAILABLE' || e.code === 'ERP_TIMEOUT')

    const result: ErpSyncOrchestratorResult = {
      ...empty,
      errors: [message],
      status: 'failed',
    }

    await finalizeSyncRun({
      syncRunId,
      adapter,
      result,
      fatalError: isErpOutage ? message : message,
      actorName,
      auditAction: isErpOutage ? 'SYNC_ERP_READ' : 'SYNC_ERP_READ',
      auditStatus: 'error_erp',
    })

    throw e
  }
}

async function finalizeSyncRun({
  syncRunId,
  adapter,
  result,
  fatalError,
  actorName,
  auditAction = 'SYNC_ERP_READ',
  auditStatus,
}: {
  syncRunId: string | null
  adapter: string
  result: ErpSyncOrchestratorResult
  fatalError: string | null
  actorName?: string | null
  auditAction?: string
  auditStatus?: string
}): Promise<void> {
  const finishedAt = new Date().toISOString()
  const errorSummary =
    fatalError ??
    (result.errors.length > 0 ? result.errors.slice(0, 5).join('; ') : null)

  const supabase = getSupabaseServerClient()
  if (supabase && syncRunId) {
    await supabase
      .from('erp_sync_runs')
      .update({
        finished_at: finishedAt,
        status: result.status,
        products_updated: result.productsUpdated,
        suppliers_updated: result.suppliersUpdated,
        pricing_rows_upserted: result.pricingRowsUpserted,
        error_summary: errorSummary,
      })
      .eq('id', syncRunId)
  }

  await writeAuditLog({
    actorName: actorName ?? 'system',
    entityType: 'erp_sync',
    entityId: syncRunId,
    action: auditAction,
    metadata: {
      adapter,
      status: auditStatus ?? result.status,
      productsUpdated: result.productsUpdated,
      suppliersUpdated: result.suppliersUpdated,
      pricingRowsUpserted: result.pricingRowsUpserted,
      errors: result.errors,
      errorSummary,
    },
  })
}

function formatError(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}
