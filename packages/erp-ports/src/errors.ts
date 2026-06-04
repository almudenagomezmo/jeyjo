export type ErpIntegrationErrorCode =
  | 'ERP_UNAVAILABLE'
  | 'ERP_TIMEOUT'
  | 'ERP_VALIDATION'
  | 'ERP_NOT_IMPLEMENTED'

export class ErpIntegrationError extends Error {
  readonly code: ErpIntegrationErrorCode

  constructor(code: ErpIntegrationErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'ErpIntegrationError'
    this.code = code
  }
}
