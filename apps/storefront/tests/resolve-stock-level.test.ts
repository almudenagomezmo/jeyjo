import { describe, expect, it } from 'vitest'

import { mapDocToRow } from '@/lib/catalog/fetch-product-list'
import { resolvePublicStockLevel } from '@/lib/catalog/resolve-stock-level'

describe('resolvePublicStockLevel', () => {
  it('uses stockIndicator when present', () => {
    expect(resolvePublicStockLevel({ stockIndicator: 'available', erpStock: 0 })).toBe('available')
  })

  it('derives available from erpStock when semáforo is missing', () => {
    expect(resolvePublicStockLevel({ erpStock: 30 })).toBe('available')
  })

  it('derives low from low erpStock when semáforo is missing', () => {
    expect(resolvePublicStockLevel({ erpStock: 3 })).toBe('low')
  })

  it('derives limited when erpStock is zero', () => {
    expect(resolvePublicStockLevel({ erpStock: 0 })).toBe('limited')
  })

  it('defaults to limited without any stock data', () => {
    expect(resolvePublicStockLevel({})).toBe('limited')
  })
})

describe('mapDocToRow stockIndicator', () => {
  it('maps available from erpStock when CMS semáforo is empty', () => {
    const row = mapDocToRow({
      skuErp: 'REF-010',
      slug: 'ref-010',
      title: 'Fixture',
      erpStock: 30,
      _status: 'published',
    })

    expect(row?.stockIndicator).toBe('available')
  })
})
