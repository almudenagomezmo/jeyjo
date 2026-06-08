import { describe, expect, it } from 'vitest'

import {
  addRelatedProductId,
  diffRelatedProductIds,
  normalizeRelatedProductIds,
  removeRelatedProductId,
} from '@/collections/Products/relatedProductsHooks'

describe('relatedProducts sync helpers', () => {
  it('normalizes relationship values to unique ids', () => {
    const ids = normalizeRelatedProductIds([10, { id: 20 }, { id: 20 }, '30'])
    expect(ids).toEqual(['10', '20', '30'])
  })

  it('diffs added and removed related ids', () => {
    const diff = diffRelatedProductIds(['1', '2'], ['2', '3'])
    expect(diff.added).toEqual(['3'])
    expect(diff.removed).toEqual(['1'])
  })

  it('adds reciprocal id without duplicates and caps at limit', () => {
    const merged = addRelatedProductId(['2', '3'], '4', '1', 3)
    expect(merged).toEqual(['2', '3', '4'])
    expect(addRelatedProductId(['2', '3', '4'], '5', '1', 3)).toEqual(['2', '3', '4'])
    expect(addRelatedProductId(['2'], '2', '1')).toEqual(['2'])
  })

  it('removes reciprocal id', () => {
    expect(removeRelatedProductId(['1', '2', '3'], '2')).toEqual(['1', '3'])
  })
})
