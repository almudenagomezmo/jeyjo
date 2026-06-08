import { unstable_cache } from 'next/cache'

export type SitePageDto = {
  slug: string
  title: string
  pageType: 'legal' | 'faq' | 'help'
  content: unknown
  metaDescription: string | null
}

function cmsBaseUrl(): string | null {
  return (
    process.env.CMS_INTERNAL_URL ??
    process.env.CMS_URL ??
    process.env.NEXT_PUBLIC_PAYLOAD_URL ??
    null
  )
}

export async function fetchSitePageUncached(slug: string): Promise<SitePageDto | null> {
  const base = cmsBaseUrl()
  if (!base) return null

  try {
    const res = await fetch(
      `${base.replace(/\/$/, '')}/api/site-pages/${encodeURIComponent(slug)}`,
      {
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(4000),
      },
    )
    if (!res.ok) return null
    return (await res.json()) as SitePageDto
  } catch {
    return null
  }
}

export function fetchSitePage(slug: string): Promise<SitePageDto | null> {
  return unstable_cache(
    () => fetchSitePageUncached(slug),
    ['site-page', slug],
    { revalidate: 300 },
  )()
}

export async function fetchFaqPage(): Promise<SitePageDto | null> {
  return fetchSitePage('faq')
}
