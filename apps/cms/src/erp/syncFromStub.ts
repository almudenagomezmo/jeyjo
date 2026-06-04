import type { Payload, PayloadRequest } from 'payload'

import { runCatalogSyncRead, type ErpSyncOrchestratorResult } from '@/erp/ErpCatalogSyncOrchestrator'

export async function syncCatalogFromStubAdapter({
  payload,
  req,
  actorName,
}: {
  payload: Payload
  req?: PayloadRequest
  actorName?: string | null
}): Promise<ErpSyncOrchestratorResult> {
  return runCatalogSyncRead({ payload, req, actorName })
}
