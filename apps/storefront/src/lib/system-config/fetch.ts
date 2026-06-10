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

function normalizeSystemConfig(raw: Partial<SystemConfigDto> | null | undefined): SystemConfigDto {
  if (!raw || typeof raw !== 'object') return DEFAULT_SYSTEM_CONFIG

  const footer = raw.footer ?? DEFAULT_SYSTEM_CONFIG.footer

  return {
    ...DEFAULT_SYSTEM_CONFIG,
    ...raw,
    shipping: {
      b2c: { ...DEFAULT_SYSTEM_CONFIG.shipping.b2c, ...raw.shipping?.b2c },
      b2b: { ...DEFAULT_SYSTEM_CONFIG.shipping.b2b, ...raw.shipping?.b2b },
    },
    stock: { ...DEFAULT_SYSTEM_CONFIG.stock, ...raw.stock },
    dashboard: { ...DEFAULT_SYSTEM_CONFIG.dashboard, ...raw.dashboard },
    erp: { ...DEFAULT_SYSTEM_CONFIG.erp, ...raw.erp },
    contact: {
      ...DEFAULT_SYSTEM_CONFIG.contact,
      ...raw.contact,
      stores: {
        alfaro: {
          ...DEFAULT_SYSTEM_CONFIG.contact.stores.alfaro,
          ...raw.contact?.stores?.alfaro,
        },
        rincon: {
          ...DEFAULT_SYSTEM_CONFIG.contact.stores.rincon,
          ...raw.contact?.stores?.rincon,
        },
      },
    },
    search: { ...DEFAULT_SYSTEM_CONFIG.search, ...raw.search },
    footer: {
      ...DEFAULT_SYSTEM_CONFIG.footer,
      ...footer,
      resolvedContact: {
        ...DEFAULT_SYSTEM_CONFIG.footer.resolvedContact,
        ...footer.resolvedContact,
      },
      social: { ...DEFAULT_SYSTEM_CONFIG.footer.social, ...footer.social },
      blog: { ...DEFAULT_SYSTEM_CONFIG.footer.blog, ...footer.blog },
      euFunding: { ...DEFAULT_SYSTEM_CONFIG.footer.euFunding, ...footer.euFunding },
    },
    webNativeMode: raw.webNativeMode !== false,
    updatedAt: raw.updatedAt ?? DEFAULT_SYSTEM_CONFIG.updatedAt,
  }
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
    return normalizeSystemConfig((await res.json()) as Partial<SystemConfigDto>)
  } catch {
    return DEFAULT_SYSTEM_CONFIG
  }
}

export const fetchSystemConfig = unstable_cache(
  fetchSystemConfigUncached,
  ['system-config', 'v2'],
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

export async function isWebNativeModeEnabled(): Promise<boolean> {
  const config = await fetchSystemConfig()
  return config.webNativeMode !== false
}
