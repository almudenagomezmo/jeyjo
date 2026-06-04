export type StockIntegrationErrorCode =
  | 'STOCK_UNAVAILABLE'
  | 'STOCK_TIMEOUT'
  | 'STOCK_NOT_IMPLEMENTED'

export class StockIntegrationError extends Error {
  readonly code: StockIntegrationErrorCode

  constructor(code: StockIntegrationErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'StockIntegrationError'
    this.code = code
  }
}
