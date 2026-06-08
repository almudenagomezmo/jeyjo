import { beforeEach, describe, expect, it } from 'vitest'

import { COMPARE_LIMIT_MESSAGE } from '@/lib/compare/constants'
import { useCompareStore } from '@/lib/store/compare-store'

describe('useCompareStore', () => {
  beforeEach(() => {
    useCompareStore.setState({ items: [], limitMessage: null })
  })

  it('adds up to three items', () => {
    const item = (sku: string) => ({
      sku,
      slug: sku.toLowerCase(),
      title: sku,
      imageUrl: null,
    })

    expect(useCompareStore.getState().toggle(item('A')).added).toBe(true)
    expect(useCompareStore.getState().toggle(item('B')).added).toBe(true)
    expect(useCompareStore.getState().toggle(item('C')).added).toBe(true)
    expect(useCompareStore.getState().items).toHaveLength(3)
  })

  it('rejects fourth item with CA2 message', () => {
    const item = (sku: string) => ({
      sku,
      slug: sku.toLowerCase(),
      title: sku,
      imageUrl: null,
    })

    useCompareStore.getState().toggle(item('A'))
    useCompareStore.getState().toggle(item('B'))
    useCompareStore.getState().toggle(item('C'))

    const result = useCompareStore.getState().toggle(item('D'))

    expect(result.rejected).toBe(true)
    expect(result.added).toBe(false)
    expect(useCompareStore.getState().items).toHaveLength(3)
    expect(useCompareStore.getState().limitMessage).toBe(COMPARE_LIMIT_MESSAGE)
  })

  it('removes item when toggled again', () => {
    const item = {
      sku: 'REF-001',
      slug: 'ref-001',
      title: 'Product',
      imageUrl: null,
    }

    useCompareStore.getState().toggle(item)
    expect(useCompareStore.getState().isSelected('REF-001')).toBe(true)

    useCompareStore.getState().toggle(item)
    expect(useCompareStore.getState().isSelected('REF-001')).toBe(false)
  })
})
