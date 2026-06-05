import { describe, expect, it } from 'vitest'

import { getScaffoldForPath } from '@/lib/intranet/navigation'

describe('wishlist stock intranet', () => {
  it('stock path is no longer a scaffold', () => {
    expect(getScaffoldForPath('/intranet/stock')).toBeFalsy()
  })
})
