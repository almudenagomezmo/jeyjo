import { unstable_cache } from 'next/cache'

import {
  resolveStorefrontLink,
  type StorefrontLinkInput,
} from '@/lib/cms/resolve-storefront-link'
import { getNavigationTree } from '@/lib/catalog/fetch-navigation-tree'
import type { GlyphKind } from '@/lib/types'

import {
  EMPTY_HOME_MERCHANDISING,
  type HomeFeaturedCategory,
  type HomeMerchandising,
  type HomePromoBanner,
} from './types'

type CmsMedia = { url?: string | null } | string | number | null

type CmsCategoryRef = {
  id?: string | number
  slug?: string | null
  title?: string | null
  homeGlyph?: GlyphKind | null
}

type CmsProductRef = { id?: string | number } | string | number

type CmsHomeGlobal = {
  promoBanners?: Array<{
    id?: string
    /** @deprecated migrado a `destination` */
    href?: string | null
    destination?: StorefrontLinkInput | null
    alt?: string | null
    segment?: 'b2c' | 'b2b' | 'both' | null
    startAt?: string | null
    endAt?: string | null
    sortOrder?: number | null
    image?: CmsMedia
  }> | null
  featuredCategories?: CmsCategoryRef[] | null
  topSalesB2c?: CmsProductRef[] | null
  topSalesB2b?: CmsProductRef[] | null
  ecoHighlight?: CmsProductRef[] | null
}

function cmsBaseUrl(): string | null {
  return (
    process.env.CMS_URL ??
    process.env.CMS_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_PAYLOAD_URL ??
    null
  )
}

function mediaUrl(image: CmsMedia): string | null {
  if (image && typeof image === 'object' && 'url' in image && image.url) {
    return String(image.url)
  }
  return null
}

function refIds(refs: CmsProductRef[] | null | undefined): string[] {
  if (!refs?.length) return []
  return refs
    .map((r) => {
      if (r == null) return null
      if (typeof r === 'object' && 'id' in r && r.id != null) return String(r.id)
      return String(r)
    })
    .filter((id): id is string => Boolean(id))
}

function mapBanners(
  raw: CmsHomeGlobal['promoBanners'],
  navTree: Awaited<ReturnType<typeof getNavigationTree>>,
): HomePromoBanner[] {
  if (!raw?.length) return []

  const mapped: HomePromoBanner[] = []
  for (const b of raw) {
    if (!b?.startAt || !b.endAt || !b.segment) continue

    const href =
      resolveStorefrontLink(b.destination, navTree) ??
      (typeof b.href === 'string' ? b.href.trim() || null : null)
    if (!href) continue

    mapped.push({
      id: b.id,
      href,
      alt: b.alt,
      segment: b.segment,
      startAt: b.startAt,
      endAt: b.endAt,
      sortOrder: b.sortOrder,
      imageUrl: mediaUrl(b.image ?? null),
    })
  }
  return mapped
}

function mapFeatured(cats: CmsCategoryRef[] | null | undefined): HomeFeaturedCategory[] {
  if (!cats?.length) return []

  return cats
    .filter((c) => c?.slug && c.title)
    .map((c) => ({
      slug: String(c.slug),
      name: String(c.title),
      glyph: c.homeGlyph ?? undefined,
    }))
}

async function fetchHomeMerchandisingRaw(): Promise<HomeMerchandising | null> {
  const base = cmsBaseUrl()
  if (!base) return null

  try {
    const url = `${base.replace(/\/$/, '')}/api/globals/home?depth=2`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 120 },
    })

    if (!res.ok) {
      console.warn(`[home] CMS global home fetch failed: ${res.status}`)
      return null
    }

    const body = (await res.json()) as CmsHomeGlobal
    const navTree = await getNavigationTree()
    return {
      promoBanners: mapBanners(body.promoBanners, navTree),
      featuredCategories: mapFeatured(body.featuredCategories),
      topSalesB2cIds: refIds(body.topSalesB2c),
      topSalesB2bIds: refIds(body.topSalesB2b),
      ecoHighlightIds: refIds(body.ecoHighlight),
    }
  } catch (error) {
    console.warn('[home] CMS global home fetch error', error)
    return null
  }
}

const cachedFetchHome = unstable_cache(
  async () => fetchHomeMerchandisingRaw(),
  ['cms-home-merchandising'],
  { revalidate: 120 },
)

export async function fetchHomeMerchandising(): Promise<HomeMerchandising> {
  try {
    const data = await cachedFetchHome()
    return data ?? EMPTY_HOME_MERCHANDISING
  } catch {
    return EMPTY_HOME_MERCHANDISING
  }
}
