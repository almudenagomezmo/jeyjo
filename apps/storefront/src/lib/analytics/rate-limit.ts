const hits = new Map<string, number>()

const WINDOW_MS = 5_000

export function isRateLimited(key: string, now = Date.now()): boolean {
  const last = hits.get(key) ?? 0
  if (now - last < WINDOW_MS) return true
  hits.set(key, now)
  if (hits.size > 10_000) {
    const cutoff = now - WINDOW_MS * 2
    for (const [k, t] of hits) {
      if (t < cutoff) hits.delete(k)
    }
  }
  return false
}
