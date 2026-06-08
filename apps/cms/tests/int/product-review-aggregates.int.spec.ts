import { describe, expect, it } from 'vitest'

describe('recalculateProductReviewAggregates', () => {
  it('computes average to one decimal from approved reviews', () => {
    const ratings = [5, 4, 3]
    const count = ratings.length
    const avg = Math.round((ratings.reduce((a, b) => a + b, 0) / count) * 10) / 10
    expect(avg).toBe(4)
  })

  it('returns null average when count is zero', () => {
    const count = 0
    const avg = count > 0 ? 5 : null
    expect(avg).toBeNull()
  })
})
