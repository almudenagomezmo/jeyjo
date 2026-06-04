import type { GlyphKind, PriceMode } from '@/lib/types'

export type BannerSegment = 'b2c' | 'b2b' | 'both'

export interface HomePromoBanner {
  id?: string
  href: string
  alt?: string | null
  segment: BannerSegment
  startAt: string
  endAt: string
  sortOrder?: number | null
  imageUrl?: string | null
}

export interface HomeFeaturedCategory {
  slug: string
  name: string
  glyph?: GlyphKind
}

export interface HomeMerchandising {
  promoBanners: HomePromoBanner[]
  featuredCategories: HomeFeaturedCategory[]
  topSalesB2cIds: string[]
  topSalesB2bIds: string[]
  ecoHighlightIds: string[]
}

export const EMPTY_HOME_MERCHANDISING: HomeMerchandising = {
  promoBanners: [],
  featuredCategories: [],
  topSalesB2cIds: [],
  topSalesB2bIds: [],
  ecoHighlightIds: [],
}

export function carouselIdsForMode(
  merch: HomeMerchandising,
  mode: PriceMode,
): { topSales: string[]; eco: string[] } {
  return {
    topSales: mode === 'b2b' ? merch.topSalesB2bIds : merch.topSalesB2cIds,
    eco: merch.ecoHighlightIds,
  }
}
