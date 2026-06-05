import type { CartLine } from '@/lib/types'

let syncTimer: ReturnType<typeof setTimeout> | null = null

export function scheduleAbandonedCartSync(lines: CartLine[]): void {
  if (typeof window === 'undefined') return
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    void fetch('/api/cart/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines }),
    })
  }, 2000)
}
