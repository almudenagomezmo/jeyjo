import { cookies } from 'next/headers'

import type { PriceMode } from '@/lib/types'

import { PRICE_MODE_COOKIE, parsePriceMode } from './price-mode'

export async function getServerPriceMode(): Promise<PriceMode> {
  const jar = await cookies()
  return parsePriceMode(jar.get(PRICE_MODE_COOKIE)?.value)
}
