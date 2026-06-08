import { findCategorySlugPathInTree } from '@/lib/catalog/build-breadcrumbs'
import type { NavNode } from '@/lib/catalog/fetch-navigation-tree'

type StorefrontLinkReference = {
  relationTo?: 'categories' | 'products' | null
  value?:
    | string
    | number
    | {
        slug?: string | null
      }
    | null
}

export type StorefrontLinkInput = {
  type?: 'reference' | 'custom' | null
  reference?: StorefrontLinkReference | null
  url?: string | null
}

function slugFromReference(ref: StorefrontLinkReference | null | undefined): string | null {
  const value = ref?.value
  if (value != null && typeof value === 'object' && value.slug?.trim()) {
    return value.slug.trim()
  }
  return null
}

export function resolveStorefrontLink(
  link: StorefrontLinkInput | null | undefined,
  navTree?: NavNode[],
): string | null {
  if (!link) return null

  const type =
    link.type ?? (link.reference ? 'reference' : link.url?.trim() ? 'custom' : null)

  if (type === 'custom') {
    const url = link.url?.trim()
    return url || null
  }

  const ref = link.reference
  const slug = slugFromReference(ref)
  if (!ref?.relationTo || !slug) return null

  if (ref.relationTo === 'products') {
    return `/p/${slug}`
  }

  if (ref.relationTo === 'categories') {
    if (navTree?.length) {
      const path = findCategorySlugPathInTree(navTree, slug)
      if (path?.length) return `/c/${path.join('/')}`
    }
    return `/c/${slug}`
  }

  return null
}
