import { unstable_cache } from 'next/cache'

import { DEFAULT_SYSTEM_CONFIG } from '@/lib/system-config/defaults'
import type { SystemConfigDto } from '@/lib/system-config/types'

function cmsBaseUrl(): string | null {
  return (
    process.env.CMS_INTERNAL_URL ??
    process.env.CMS_URL ??
    process.env.NEXT_PUBLIC_PAYLOAD_URL ??
    null
  )
}

export async function fetchSystemConfigUncached(): Promise<SystemConfigDto> {
  const base = cmsBaseUrl()
  if (!base) return DEFAULT_SYSTEM_CONFIG

  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/system/config`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return DEFAULT_SYSTEM_CONFIG
    return (await res.json()) as SystemConfigDto
  } catch {
    return DEFAULT_SYSTEM_CONFIG
  }
}

export const fetchSystemConfig = unstable_cache(
  fetchSystemConfigUncached,
  ['system-config'],
  { revalidate: 60 },
)

export async function getShippingRules() {
  const config = await fetchSystemConfig()
  return config.shipping
}

export async function getStockLowThreshold(): Promise<number> {
  const config = await fetchSystemConfig()
  return config.stock.lowThreshold
}

export async function getCatalogStalenessMs(): Promise<number> {
  const config = await fetchSystemConfig()
  return config.erp.catalogStalenessHours * 60 * 60 * 1000
}

export async function getSearchConfig() {
  const config = await fetchSystemConfig()
  return config.search
}

export async function getContactConfig() {
  const config = await fetchSystemConfig()
  return config.contact
}
