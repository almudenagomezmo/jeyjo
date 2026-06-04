import type { ErpPurchaseHistoryReader } from '../../ports/purchase-history-reader.js'
import type { ErpPurchaseHistoryLineDto } from '../../types/purchase-history-dtos.js'
import { ErpIntegrationError } from '../../errors.js'
import { getStubSimulateUnavailable } from './store.js'
import { STUB_PURCHASE_HISTORY } from './purchase-history-data.js'

function matchesDate(line: ErpPurchaseHistoryLineDto, from?: string, to?: string): boolean {
  const day = line.purchasedAt.slice(0, 10)
  if (from && day < from) return false
  if (to && day > to) return false
  return true
}

function matchesSku(line: ErpPurchaseHistoryLineDto, sku?: string): boolean {
  if (!sku?.trim()) return true
  return line.sku.toLowerCase().includes(sku.trim().toLowerCase())
}

function matchesDepartment(line: ErpPurchaseHistoryLineDto, department?: string): boolean {
  if (!department?.trim()) return true
  const dept = line.department?.trim()
  if (!dept) return false
  return dept.toLowerCase() === department.trim().toLowerCase()
}

export function createStubPurchaseHistoryReader(): ErpPurchaseHistoryReader {
  return {
    async listLines(customerErpCode, options) {
      if (getStubSimulateUnavailable()) {
        throw new ErpIntegrationError('ERP_UNAVAILABLE', 'Stub ERP purchase history unavailable')
      }

      const rows = STUB_PURCHASE_HISTORY[customerErpCode] ?? []
      const filtered = rows.filter(
        (line) =>
          matchesDate(line, options?.from, options?.to) &&
          matchesSku(line, options?.sku) &&
          matchesDepartment(line, options?.department),
      )

      const limit = options?.limit ?? filtered.length
      return filtered.slice(0, limit)
    },
  }
}
