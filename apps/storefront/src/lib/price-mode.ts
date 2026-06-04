import type { PriceMode } from '@/lib/types'

export const PRICE_MODE_COOKIE = 'jeyjo-price-mode'

export function parsePriceMode(value: string | undefined | null): PriceMode {
  return value === 'b2b' ? 'b2b' : 'b2c'
}

/** Client-only: persist price mode for RSC reads after refresh. */
export function writePriceModeCookie(mode: PriceMode): void {
  if (typeof document === 'undefined') return
  const maxAge = 60 * 60 * 24 * 365
  document.cookie = `${PRICE_MODE_COOKIE}=${mode}; path=/; max-age=${maxAge}; SameSite=Lax`
}
