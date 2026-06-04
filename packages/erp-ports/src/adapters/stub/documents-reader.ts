import { ErpIntegrationError } from '../../errors.js'
import type { ErpDocumentsReader } from '../../ports/documents-reader.js'

export function createStubDocumentsReader(): ErpDocumentsReader {
  const notImplemented = async (): Promise<never> => {
    throw new ErpIntegrationError(
      'ERP_NOT_IMPLEMENTED',
      'ErpDocumentsReader is not implemented in the stub phase (see change #37)',
    )
  }

  return {
    listInvoices: notImplemented,
    listDeliveryNotes: notImplemented,
  }
}
