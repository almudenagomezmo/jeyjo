import { describe, expect, it } from 'vitest'

import { channelFieldForType } from '@/lib/notifications/channels'

describe('notification channels stock_available', () => {
  it('maps stock_available to wishlist_channel', () => {
    expect(channelFieldForType('stock_available')).toBe('wishlist_channel')
  })
})
