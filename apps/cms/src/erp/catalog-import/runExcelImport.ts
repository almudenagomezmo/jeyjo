import { createExcelCatalogReader } from '@jeyjo/erp-excel'
import { parseImportacionArticulos } from '@jeyjo/erp-excel'
import type { Payload, PayloadRequest } from 'payload'

import { ErpCatalogSyncService } from '@/erp/ErpCatalogSyncService'
import { enqueueSearchEventsForSkus } from '@/erp/catalog-import/search-events'
import { loadImportFile } from '@/erp/catalog-import/storage'
import { recalculateStockIndicatorsForSkus } from '@/stock/recalculateIndicators'
import { getSupabaseServerClient, writeAuditLog } from '@/lib/supabase-server'

export type ExcelImportApplyResult = {
  importId: string
  productsUpdated: number
  suppliersUpdated: number
  updatedSkus: string[]
  wildcards: number
  errors: string[]
  syncRunId: string | null
  status: 'success' | 'partial' | 'failed'
}

export async function runExcelCatalogImportApply({
  payload,
  req,
  importId,
  actorName,
  actorId,
}: {
  payload: Payload
  req: PayloadRequest
  importId: string
  actorName: string
  actorId?: string | number | null
}): Promise<ExcelImportApplyResult> {
  const buffer = await loadImportFile(importId)
  const parsed = await parseImportacionArticulos(buffer)

  if (parsed.errors.some((e) => e.blocking)) {
    throw new Error('Import has blocking validation errors; run parse again')
  }

  const supabase = getSupabaseServerClient()
  let syncRunId: string | null = null

  if (supabase) {
    const { data } = await supabase
      .from('erp_sync_runs')
      .insert({
        adapter: 'excel',
        source: 'excel_import',
        status: 'failed',
        products_updated: 0,
        suppliers_updated: 0,
        pricing_rows_upserted: 0,
      })
      .select('id')
      .single()
    syncRunId = data?.id ?? null
  }

  const reader = createExcelCatalogReader({
    products: parsed.products,
    suppliers: parsed.suppliers,
  })
  const service = new ErpCatalogSyncService(payload, reader)
  const syncResult = await service.syncAllFromReader(req)

  if (syncResult.updatedSkus.length > 0) {
    const indicatorResult = await recalculateStockIndicatorsForSkus({
      payload,
      req,
      skus: syncResult.updatedSkus,
    })
    syncResult.errors.push(...indicatorResult.errors)
    await enqueueSearchEventsForSkus(payload, syncResult.updatedSkus)
  }

  const status: ExcelImportApplyResult['status'] =
    syncResult.errors.length > 0
      ? syncResult.productsUpdated + syncResult.suppliersUpdated > 0
        ? 'partial'
        : 'failed'
      : 'success'

  const result: ExcelImportApplyResult = {
    importId,
    productsUpdated: syncResult.productsUpdated,
    suppliersUpdated: syncResult.suppliersUpdated,
    updatedSkus: syncResult.updatedSkus,
    wildcards: parsed.wildcards,
    errors: syncResult.errors,
    syncRunId,
    status,
  }

  if (supabase && syncRunId) {
    await supabase
      .from('erp_sync_runs')
      .update({
        finished_at: new Date().toISOString(),
        status: result.status,
        products_updated: result.productsUpdated,
        suppliers_updated: result.suppliersUpdated,
        error_summary:
          result.errors.length > 0 ? result.errors.slice(0, 5).join('; ') : null,
      })
      .eq('id', syncRunId)
  }

  await writeAuditLog({
    actorId,
    actorName,
    entityType: 'catalog_import',
    entityId: importId,
    action: 'IMPORT_CATALOG_EXCEL',
    metadata: {
      adapter: 'excel',
      source: 'excel_import',
      status: result.status,
      processed: result.productsUpdated,
      suppliersUpdated: result.suppliersUpdated,
      errors: result.errors.length,
      wildcards: result.wildcards,
      syncRunId,
    },
  })

  return result
}
