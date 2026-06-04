import { unstable_cache } from 'next/cache'

import { CATEGORIES } from '@/lib/data/categories'
import type { GlyphKind } from '@/lib/types'

export interface NavNode {
  id: string
  title: string
  slug: string
  glyph?: GlyphKind
  children: NavNode[]
}

export interface CmsCategoryDoc {
  id: string | number
  title: string
  slug: string
  sortOrder?: number | null
  parent?: string | number | { id: string | number } | null
}

const SLUG_GLYPH_MAP: Record<string, GlyphKind> = {
  escritura: 'pen',
  papel: 'paper',
  impresion: 'toner',
  archivo: 'folder',
  oficina: 'stapler',
  reciclaje: 'recycle',
}

function cmsBaseUrl(): string | null {
  return (
    process.env.CMS_URL ??
    process.env.CMS_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_PAYLOAD_URL ??
    null
  )
}

function parentId(parent: CmsCategoryDoc['parent']): string | null {
  if (parent == null) return null
  if (typeof parent === 'object') return String(parent.id)
  return String(parent)
}

function isValidSlug(slug: string | undefined | null): slug is string {
  return typeof slug === 'string' && slug.trim().length > 0
}

async function fetchCategoriesFromCmsRaw(): Promise<CmsCategoryDoc[]> {
  const base = cmsBaseUrl()
  if (!base) return []

  const url = `${base.replace(/\/$/, '')}/api/categories?depth=0&limit=500&sort=sortOrder`
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    throw new Error(`CMS categories fetch failed: ${res.status}`)
  }

  const body = (await res.json()) as { docs?: CmsCategoryDoc[] }
  return body.docs ?? []
}

const cachedFetchCategories = unstable_cache(
  async () => fetchCategoriesFromCmsRaw(),
  ['cms-navigation-categories'],
  { revalidate: 300 },
)

export async function fetchCategoriesFromCms(): Promise<CmsCategoryDoc[]> {
  try {
    return await cachedFetchCategories()
  } catch {
    return []
  }
}

function buildSubtree(
  doc: CmsCategoryDoc,
  childrenByParent: Map<string, CmsCategoryDoc[]>,
  depth: number,
  maxDepth: number,
): NavNode | null {
  if (!isValidSlug(doc.slug)) return null

  const childDocs = childrenByParent.get(String(doc.id)) ?? []
  const children =
    depth < maxDepth
      ? childDocs
          .map((child) => buildSubtree(child, childrenByParent, depth + 1, maxDepth))
          .filter((node): node is NavNode => node != null)
      : []

  if (depth === maxDepth && childDocs.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn(
      `[navigation] Category "${doc.slug}" has children beyond depth ${maxDepth}; truncating.`,
    )
  }

  return {
    id: String(doc.id),
    title: doc.title,
    slug: doc.slug,
    glyph: SLUG_GLYPH_MAP[doc.slug],
    children,
  }
}

export function buildNavigationTree(docs: CmsCategoryDoc[], maxDepth = 3): NavNode[] {
  const validDocs = docs.filter((doc) => isValidSlug(doc.slug))
  const byId = new Map(validDocs.map((doc) => [String(doc.id), doc]))
  const childrenByParent = new Map<string, CmsCategoryDoc[]>()

  for (const doc of validDocs) {
    const pid = parentId(doc.parent)
    if (pid && byId.has(pid)) {
      const siblings = childrenByParent.get(pid) ?? []
      siblings.push(doc)
      childrenByParent.set(pid, siblings)
    }
  }

  for (const siblings of childrenByParent.values()) {
    siblings.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  }

  const roots = validDocs
    .filter((doc) => {
      const pid = parentId(doc.parent)
      return !pid || !byId.has(pid)
    })
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  return roots
    .map((doc) => buildSubtree(doc, childrenByParent, 1, maxDepth))
    .filter((node): node is NavNode => node != null)
}

function staticCategoriesToNavNodes(): NavNode[] {
  return CATEGORIES.map((cat) => ({
    id: cat.id,
    title: cat.name,
    slug: cat.id,
    glyph: cat.glyph,
    children: cat.subcategories.map((sub) => ({
      id: sub.id,
      title: sub.name,
      slug: sub.id,
      children: [],
    })),
  }))
}

export async function getNavigationTree(): Promise<NavNode[]> {
  try {
    const docs = await fetchCategoriesFromCms()
    if (docs.length === 0) {
      console.warn('[navigation] CMS returned no categories; using static fallback.')
      return staticCategoriesToNavNodes()
    }

    const tree = buildNavigationTree(docs)
    if (tree.length === 0) {
      console.warn('[navigation] Built empty navigation tree; using static fallback.')
      return staticCategoriesToNavNodes()
    }

    return tree
  } catch (error) {
    console.warn('[navigation] CMS fetch failed; using static fallback.', error)
    return staticCategoriesToNavNodes()
  }
}
