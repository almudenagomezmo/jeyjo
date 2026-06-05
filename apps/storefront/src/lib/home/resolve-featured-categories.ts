import type { NavNode } from '@/lib/catalog/fetch-navigation-tree'
import type { HomeFeaturedCategory } from '@/lib/home/types'
import type { GlyphKind } from '@/lib/types'

export function categoryHref(slug: string | undefined): string {
  return slug ? `/c/${slug}` : '/'
}

/** PLP href for a root category by index in the CMS-sorted navigation tree. */
export function rootCategoryHref(tree: NavNode[], index: number): string {
  return categoryHref(tree[index]?.slug)
}

/** PLP href for the first root matching a predicate (e.g. homeGlyph). */
export function findRootCategoryHref(
  tree: NavNode[],
  match: (node: NavNode) => boolean,
): string | null {
  const node = tree.find(match)
  return node ? categoryHref(node.slug) : null
}

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
