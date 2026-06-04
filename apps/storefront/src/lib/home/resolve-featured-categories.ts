import type { NavNode } from '@/lib/catalog/fetch-navigation-tree'
import type { HomeFeaturedCategory } from '@/lib/home/types'
import type { GlyphKind } from '@/lib/types'

export function featuredFromMerch(
  configured: HomeFeaturedCategory[],
): HomeFeaturedCategory[] {
  if (configured.length > 0) return configured.slice(0, 6)
  return []
}

export function featuredFromNavRoots(tree: NavNode[]): HomeFeaturedCategory[] {
  return tree.slice(0, 6).map((node) => ({
    slug: node.slug,
    name: node.title,
    glyph: node.glyph as GlyphKind | undefined,
  }))
}
