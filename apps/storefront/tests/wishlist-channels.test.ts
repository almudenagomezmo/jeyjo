import { describe, expect, it } from 'vitest'

import { getScaffoldForPath } from '@/lib/intranet/navigation'

describe('wishlist stock empresa', () => {
  it('stock path is no longer in empresa nav scaffolds', () => {
    expect(getScaffoldForPath('/cuenta/avisos-stock')).toBeFalsy()
  })
})
