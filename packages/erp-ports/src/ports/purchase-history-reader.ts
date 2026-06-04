import type {
  ErpPurchaseHistoryLineDto,
  ErpPurchaseHistoryListOptions,
} from '../types/purchase-history-dtos.js'

/**
 * Read-only ERP purchase history (consumption lines from delivery notes / sales).
 * Production Avansuite adapter: change #36 — expected API fields documented in stub adapter.
 */
export interface ErpPurchaseHistoryReader {
  listLines(
    customerErpCode: string,
    options?: ErpPurchaseHistoryListOptions,
  ): Promise<ErpPurchaseHistoryLineDto[]>
}
