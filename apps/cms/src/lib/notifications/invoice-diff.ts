import type { ErpInvoiceListItem } from '@jeyjo/erp-ports'

export function findNewInvoiceIds(
  knownIds: string[],
  invoices: ErpInvoiceListItem[],
): ErpInvoiceListItem[] {
  const knownSet = new Set(knownIds)
  return invoices.filter((inv) => !knownSet.has(inv.id))
}
