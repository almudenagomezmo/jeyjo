import { unstable_cache } from 'next/cache'

import type { GlyphKind } from '@/lib/types'

import { readCategorySnapshot, type CmsCategoryDoc } from './category-snapshot'

export type { CmsCategoryDoc } from './category-snapshot'

export interface NavNode {
  id: string
  title: string
  slug: string
  glyph?: GlyphKind
  children: NavNode[]
}

const CMS_EMPTY = 'CMS_CATEGORIES_EMPTY'

function cmsBaseUrl(): string | null {
  return (
    process.env.CMS_URL ??
    process.env.CMS_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_PAYLOAD_URL ??
    null
  )
}

function cmsFetchTimeoutMs(): number {
  const raw = process.env.CMS_FETCH_TIMEOUT_MS
  if (!raw) return 3000
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : 3000
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
    signal: AbortSignal.timeout(cmsFetchTimeoutMs()),
  })

  if (!res.ok) {
    throw new Error(`CMS categories fetch failed: ${res.status}`)
  }

  const body = (await res.json()) as { docs?: CmsCategoryDoc[] }
  return body.docs ?? []
}

const cachedFetchCategoriesNonEmpty = unstable_cache(
  async () => {
    const docs = await fetchCategoriesFromCmsRaw()
    if (docs.length === 0) {
      throw new Error(CMS_EMPTY)
    }
    return docs
  },
  ['cms-navigation-categories'],
  { revalidate: 300 },
)

async function fetchCategoriesFromCmsLive(): Promise<CmsCategoryDoc[]> {
  if (!cmsBaseUrl()) return []

  // Dev: always hit CMS so Payload admin edits appear without waiting for cache TTL.
  if (process.env.NODE_ENV === 'development') {
    try {
      return await fetchCategoriesFromCmsRaw()
    } catch {
      return []
    }
  }

  try {
    return await cachedFetchCategoriesNonEmpty()
  } catch (err) {
    if (err instanceof Error && err.message === CMS_EMPTY) {
      return []
    }
    try {
      return await fetchCategoriesFromCmsRaw()
    } catch {
      return []
    }
  }
}

export async function fetchCategoryDocs(): Promise<CmsCategoryDoc[]> {
  const live = await fetchCategoriesFromCmsLive()
  if (live.length > 0) return live

  const snapshot = readCategorySnapshot()
  if (snapshot && snapshot.docs.length > 0) {
    if (live.length === 0 && cmsBaseUrl()) {
      console.warn('[navigation] Live CMS unavailable or empty; using category snapshot.')
    }
    return snapshot.docs
  }

  console.warn('[navigation] No categories from CMS or snapshot.')
  return []
}

/** @deprecated Use fetchCategoryDocs */
export async function fetchCategoriesFromCms(): Promise<CmsCategoryDoc[]> {
  return fetchCategoryDocs()
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
    glyph: doc.homeGlyph ?? undefined,
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

export async function getNavigationTree(): Promise<NavNode[]> {
  try {
    const docs = await fetchCategoryDocs()
    if (docs.length === 0) return []

    const tree = buildNavigationTree(docs)
    if (tree.length === 0) {
      console.warn('[navigation] Built empty navigation tree from category docs.')
    }
    return tree
  } catch (error) {
    console.warn('[navigation] Failed to build navigation tree.', error)
    const snapshot = readCategorySnapshot()
    if (snapshot?.docs.length) {
      return buildNavigationTree(snapshot.docs)
    }
    return []
  }
}
