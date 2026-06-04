import { describe, expect, it } from 'vitest'

import { filterActiveBanners } from '@/lib/home/filter-banners'
import type { HomePromoBanner } from '@/lib/home/types'

const now = new Date('2025-06-15T12:00:00Z')

function banner(overrides: Partial<HomePromoBanner>): HomePromoBanner {
  return {
    href: '/c/test',
    segment: 'both',
    startAt: '2025-06-14T00:00:00Z',
    endAt: '2025-06-16T00:00:00Z',
    sortOrder: 0,
    ...overrides,
  }
}

describe('filterActiveBanners', () => {
  it('omits expired banners', () => {
    const result = filterActiveBanners(
      [
        banner({ endAt: '2025-06-10T00:00:00Z' }),
        banner({ sortOrder: 1 }),
      ],
      now,
      'b2c',
    )
    expect(result).toHaveLength(1)
  })

  it('omits wrong segment', () => {
    const result = filterActiveBanners(
      [banner({ segment: 'b2b' }), banner({ segment: 'b2c', sortOrder: 1 })],
      now,
      'b2c',
    )
    expect(result).toHaveLength(1)
    expect(result[0]?.segment).toBe('b2c')
  })

  it('includes both segment for any mode', () => {
    const result = filterActiveBanners([banner({ segment: 'both' })], now, 'b2b')
    expect(result).toHaveLength(1)
  })

  it('caps at three banners sorted by sortOrder', () => {
    const result = filterActiveBanners(
      [
        banner({ sortOrder: 5 }),
        banner({ sortOrder: 1 }),
        banner({ sortOrder: 3 }),
        banner({ sortOrder: 2 }),
      ],
      now,
      'b2c',
    )
    expect(result).toHaveLength(3)
    expect(result.map((b) => b.sortOrder)).toEqual([1, 2, 3])
  })
})
