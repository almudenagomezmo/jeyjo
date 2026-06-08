import { describe, expect, it } from 'vitest'

import { readCategorySnapshot } from '@/lib/catalog/category-snapshot'
import {
  appendCrumb,
  buildBreadcrumbsFromCategorySlugs,
  buildBreadcrumbsFromPath,
  findCategorySlugPathInTree,
} from '@/lib/catalog/build-breadcrumbs'
import {
  buildNavigationTree,
  collectDescendantSlugs,
  type CmsCategoryDoc,
  type NavNode,
} from '@/lib/catalog/fetch-navigation-tree'

const DEMO_TREE: NavNode[] = [
  {
    id: '1',
    title: 'Escritura y corrección',
    slug: 'escritura',
    glyph: 'pen',
    children: [
      {
        id: '2',
        title: 'Bolígrafos',
        slug: 'boligrafos',
        children: [
          { id: '5', title: 'Gel', slug: 'gel', children: [] },
          { id: '6', title: 'Tinta', slug: 'tinta', children: [] },
        ],
      },
      { id: '3', title: 'Rotuladores', slug: 'rotuladores', children: [] },
    ],
  },
  {
    id: '4',
    title: 'Papel y blocs',
    slug: 'papel',
    glyph: 'paper',
    children: [],
  },
]

describe('collectDescendantSlugs', () => {
  it('returns node slug and all descendant slugs for a three-level tree', () => {
    const root = DEMO_TREE[0]!
    expect(collectDescendantSlugs(root).sort()).toEqual(
      ['boligrafos', 'escritura', 'gel', 'rotuladores', 'tinta'].sort(),
    )
  })

  it('returns only the leaf slug for a node without children', () => {
    const leaf = DEMO_TREE[0]!.children[1]!
    expect(collectDescendantSlugs(leaf)).toEqual(['rotuladores'])
  })

  it('returns subcategory and family slugs for a mid-level node', () => {
    const sub = DEMO_TREE[0]!.children[0]!
    expect(collectDescendantSlugs(sub).sort()).toEqual(['boligrafos', 'gel', 'tinta'].sort())
  })
})

describe('buildNavigationTree', () => {
  it('builds parent/child hierarchy ordered by sortOrder', () => {
    const docs: CmsCategoryDoc[] = [
      { id: 1, title: 'Escritura', slug: 'escritura', sortOrder: 1, homeGlyph: 'pen' },
      { id: 2, title: 'Bolígrafos', slug: 'boligrafos', sortOrder: 2, parent: 1 },
      { id: 3, title: 'Rotuladores', slug: 'rotuladores', sortOrder: 3, parent: 1 },
      { id: 4, title: 'Papel', slug: 'papel', sortOrder: 4, homeGlyph: 'paper' },
    ]

    const tree = buildNavigationTree(docs)

    expect(tree).toHaveLength(2)
    expect(tree[0]?.slug).toBe('escritura')
    expect(tree[0]?.glyph).toBe('pen')
    expect(tree[0]?.children.map((c) => c.slug)).toEqual(['boligrafos', 'rotuladores'])
    expect(tree[1]?.slug).toBe('papel')
  })

  it('supports three levels and omits deeper nodes from tree output', () => {
    const docs: CmsCategoryDoc[] = [
      { id: 1, title: 'Escritura', slug: 'escritura', sortOrder: 1 },
      { id: 2, title: 'Bolígrafos', slug: 'boligrafos', sortOrder: 1, parent: 1 },
      { id: 3, title: 'Gel', slug: 'gel', sortOrder: 1, parent: 2 },
      { id: 4, title: 'Tinta', slug: 'tinta', sortOrder: 2, parent: 2 },
    ]

    const tree = buildNavigationTree(docs)

    expect(tree[0]?.children[0]?.children).toHaveLength(2)
    expect(tree[0]?.children[0]?.children[0]?.slug).toBe('gel')
  })

  it('filters categories without valid slug', () => {
    const docs: CmsCategoryDoc[] = [
      { id: 1, title: 'Valid', slug: 'valid', sortOrder: 1 },
      { id: 2, title: 'Invalid', slug: '', sortOrder: 2 },
    ]

    expect(buildNavigationTree(docs)).toHaveLength(1)
  })

  it('uses homeGlyph from CMS doc on root nodes', () => {
    const docs: CmsCategoryDoc[] = [
      { id: 1, title: 'Escritura', slug: 'escritura', sortOrder: 1, homeGlyph: 'pen' },
    ]

    expect(buildNavigationTree(docs)[0]?.glyph).toBe('pen')
  })
})

describe('readCategorySnapshot', () => {
  it('loads non-empty docs from committed snapshot', () => {
    const snapshot = readCategorySnapshot()
    expect(snapshot).not.toBeNull()
    expect(snapshot!.docs.length).toBeGreaterThan(0)
    expect(snapshot!.syncedAt.length).toBeGreaterThan(0)
  })

  it('builds navigation tree from snapshot docs', () => {
    const snapshot = readCategorySnapshot()
    expect(snapshot).not.toBeNull()

    const tree = buildNavigationTree(snapshot!.docs)
    expect(tree.length).toBeGreaterThan(0)
    expect(tree.some((node) => node.slug === 'escritura')).toBe(true)
  })
})

describe('findCategorySlugPathInTree', () => {
  it('returns full path for a nested subcategory slug', () => {
    expect(findCategorySlugPathInTree(DEMO_TREE, 'boligrafos')).toEqual([
      'escritura',
      'boligrafos',
    ])
  })

  it('returns full path for a family slug', () => {
    expect(findCategorySlugPathInTree(DEMO_TREE, 'gel')).toEqual([
      'escritura',
      'boligrafos',
      'gel',
    ])
  })

  it('returns null when slug is not in the tree', () => {
    expect(findCategorySlugPathInTree(DEMO_TREE, 'unknown')).toBeNull()
  })
})

describe('buildBreadcrumbsFromCategorySlugs', () => {
  it('builds full category trail from a leaf slug (PDP)', () => {
    const crumbs = buildBreadcrumbsFromCategorySlugs(DEMO_TREE, ['boligrafos'])

    expect(crumbs.map((c) => c.label)).toEqual([
      'Inicio',
      'Escritura y corrección',
      'Bolígrafos',
    ])
    expect(crumbs[1]?.href).toBe('/c/escritura')
    expect(crumbs[2]?.href).toBe('/c/escritura/boligrafos')
  })

  it('keeps subcategory href when product title is appended (PDP)', () => {
    const base = buildBreadcrumbsFromCategorySlugs(DEMO_TREE, ['boligrafos'])
    const crumbs = appendCrumb(base, 'Fixture CA-B2B-004')

    expect(crumbs.map((c) => c.label)).toEqual([
      'Inicio',
      'Escritura y corrección',
      'Bolígrafos',
      'Fixture CA-B2B-004',
    ])
    expect(crumbs[2]?.href).toBe('/c/escritura/boligrafos')
    expect(crumbs[3]?.href).toBeUndefined()
  })

  it('prefers the deepest matching slug when multiple categories are assigned', () => {
    const crumbs = buildBreadcrumbsFromCategorySlugs(DEMO_TREE, ['boligrafos', 'gel'])

    expect(crumbs.map((c) => c.label)).toEqual([
      'Inicio',
      'Escritura y corrección',
      'Bolígrafos',
      'Gel',
    ])
  })

  it('returns home only when no category slug matches the tree', () => {
    const crumbs = buildBreadcrumbsFromCategorySlugs(DEMO_TREE, ['unknown'])
    expect(crumbs).toEqual([{ label: 'Inicio', href: '/' }])
  })
})

describe('buildBreadcrumbsFromPath', () => {
  it('builds trail for subcategory path', () => {
    const crumbs = buildBreadcrumbsFromPath(DEMO_TREE, '/c/escritura/boligrafos')

    expect(crumbs).toHaveLength(3)
    expect(crumbs[0]?.label).toBe('Inicio')
    expect(crumbs[1]?.label).toBe('Escritura y corrección')
    expect(crumbs[1]?.href).toBe('/c/escritura')
    expect(crumbs[2]?.label).toBe('Bolígrafos')
    expect(crumbs[2]?.href).toBe('/c/escritura/boligrafos')
  })

  it('builds trail for family path', () => {
    const crumbs = buildBreadcrumbsFromPath(DEMO_TREE, '/c/escritura/boligrafos/gel')

    expect(crumbs).toHaveLength(4)
    expect(crumbs[0]?.label).toBe('Inicio')
    expect(crumbs[1]?.label).toBe('Escritura y corrección')
    expect(crumbs[1]?.href).toBe('/c/escritura')
    expect(crumbs[2]?.label).toBe('Bolígrafos')
    expect(crumbs[2]?.href).toBe('/c/escritura/boligrafos')
    expect(crumbs[3]?.label).toBe('Gel')
    expect(crumbs[3]?.href).toBe('/c/escritura/boligrafos/gel')
  })

  it('includes search crumb', () => {
    const crumbs = buildBreadcrumbsFromPath(DEMO_TREE, '/search')
    expect(crumbs.map((c) => c.label)).toEqual(['Inicio', 'Buscar'])
  })

  it('returns home only for unknown paths', () => {
    const crumbs = buildBreadcrumbsFromPath(DEMO_TREE, '/cart')
    expect(crumbs).toHaveLength(1)
  })
})
