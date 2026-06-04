import type { PayloadRequest } from 'payload'

declare module 'payload' {
  interface RequestContext {
    /** Set by ErpCatalogSyncService so beforeChange allows ERP field writes. */
    erpSync?: boolean
  }
}

export type ErpPayloadRequest = PayloadRequest
