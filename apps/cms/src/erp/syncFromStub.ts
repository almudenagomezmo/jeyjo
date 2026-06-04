import type { Payload, PayloadRequest } from 'payload'

import { ErpCatalogSyncService } from '@/erp/ErpCatalogSyncService'
import { getErpAdapters } from '@/erp/registry'

export async function syncCatalogFromStubAdapter({
  payload,
  req,
}: {
  payload: Payload
  req?: PayloadRequest
}): Promise<ReturnType<ErpCatalogSyncService['syncAllFromReader']>> {
  const { catalogReader } = getErpAdapters()
  const service = new ErpCatalogSyncService(payload, catalogReader)
  return service.syncAllFromReader(req)
}
