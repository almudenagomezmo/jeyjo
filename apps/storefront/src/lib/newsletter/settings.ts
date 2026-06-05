import { unstable_cache } from 'next/cache'

import type { NewsletterSettings } from './types'

const DEFAULT_SETTINGS: NewsletterSettings = {
  enabled: true,
  headline: 'Newsletter Jeyjo',
  description: 'Recibe ofertas y novedades de material de oficina.',
  privacyPolicyUrl: '/privacidad',
}

function cmsBaseUrl(): string | null {
  return (
    process.env.CMS_URL ??
    process.env.CMS_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_PAYLOAD_URL ??
    null
  )
}

async function fetchNewsletterSettingsUncached(): Promise<NewsletterSettings> {
  const base = cmsBaseUrl()
  if (!base) return DEFAULT_SETTINGS

  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/globals/newsletterSettings?depth=0`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return DEFAULT_SETTINGS
    const data = (await res.json()) as Partial<NewsletterSettings>
    return {
      enabled: data.enabled !== false,
      headline: data.headline?.trim() || DEFAULT_SETTINGS.headline,
      description: data.description?.trim() || DEFAULT_SETTINGS.description,
      privacyPolicyUrl: data.privacyPolicyUrl?.trim() || DEFAULT_SETTINGS.privacyPolicyUrl,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export async function getNewsletterSettings(): Promise<NewsletterSettings> {
  if (process.env.NODE_ENV === 'development') {
    return fetchNewsletterSettingsUncached()
  }
  const cached = unstable_cache(fetchNewsletterSettingsUncached, ['newsletter-settings'], {
    revalidate: 60,
  })
  return cached()
}
