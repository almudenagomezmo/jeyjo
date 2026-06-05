import { describe, expect, it } from 'vitest'

import { isOpenRmaStatus, RMA_CLOSED_STATUSES, RMA_OPEN_STATUSES } from '@/lib/intranet/rma/labels'
import { validateCreateRmaInput } from '@/lib/intranet/rma/validate'

describe('validateCreateRmaInput', () => {
  it('requires observations when reason is other', () => {
    const err = validateCreateRmaInput({
      articleSku: 'REF-011',
      deliveryNoteNumber: 'ALB-2026-001',
      reason: 'other',
      observations: 'corto',
    })
    expect(err?.field).toBe('observations')
  })

  it('accepts valid wrong_item request', () => {
    const err = validateCreateRmaInput({
      articleSku: 'REF-011',
      deliveryNoteNumber: 'ALB-2026-001',
      reason: 'wrong_item',
      observations: 'Pedí azul, me enviaron rojo',
    })
    expect(err).toBeNull()
  })
})

describe('RMA status grouping', () => {
  it('open vs closed sets', () => {
    expect(isOpenRmaStatus('requested')).toBe(true)
    expect(isOpenRmaStatus('in_review')).toBe(true)
    expect(isOpenRmaStatus('authorized')).toBe(false)
    expect(RMA_OPEN_STATUSES).toContain('requested')
    expect(RMA_CLOSED_STATUSES).toContain('rejected')
  })
})
