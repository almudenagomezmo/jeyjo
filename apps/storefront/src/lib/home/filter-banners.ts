import type { BannerSegment, HomePromoBanner } from '@/lib/home/types'
import type { PriceMode } from '@/lib/types'

const MAX_ACTIVE_BANNERS = 3

function segmentMatches(bannerSegment: BannerSegment, mode: PriceMode): boolean {
  if (bannerSegment === 'both') return true
  return bannerSegment === mode
}

/** Active banners for segment, sorted by sortOrder, capped at 3. */
export function filterActiveBanners(
  banners: HomePromoBanner[],
  now: Date,
  segment: PriceMode,
): HomePromoBanner[] {
  const ts = now.getTime()

  return [...banners]
    .filter((b) => {
      const start = new Date(b.startAt).getTime()
      const end = new Date(b.endAt).getTime()
      if (Number.isNaN(start) || Number.isNaN(end)) return false
      if (ts < start || ts > end) return false
      return segmentMatches(b.segment, segment)
    })
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .slice(0, MAX_ACTIVE_BANNERS)
}
