import { describe, expect, it } from 'vitest'

import {
  PURCHASE_HISTORY_STATUS_OPTIONS,
  orderStatusTone,
  purchaseHistoryInclusionNotice,
} from '@/lib/orders/purchase-history-status'

describe('purchase history status helpers', () => {
  it('maps pending B2B statuses to warning tone', () => {
    expect(orderStatusTone('pending_confirmation')).toBe('warning')
    expect(orderStatusTone('pending_company_approval')).toBe('warning')
  })

  it('exposes filter options for each included status', () => {
    expect(PURCHASE_HISTORY_STATUS_OPTIONS.map((o) => o.value)).toEqual(
      expect.arrayContaining(['pending_confirmation', 'confirmed', 'delivered']),
    )
  })

  it('describes included order statuses in the notice', () => {
    const notice = purchaseHistoryInclusionNotice()
    expect(notice).toContain('Pendiente de confirmación')
    expect(notice).toContain('Pendiente aprobación empresa')
    expect(notice).toContain('Confirmado')
    expect(notice).toContain('No se incluyen pedidos cancelados')
  })
})
