import type { PayloadRequest } from 'payload'

declare module 'payload' {
  interface RequestContext {
    /** Set by ErpCatalogSyncService so beforeChange allows ERP field writes. */
    erpSync?: boolean
    /** Set by StockSyncOrchestrator so beforeChange allows stock sync field writes. */
    stockSync?: boolean
  }
}

export type ErpPayloadRequest = PayloadRequest
