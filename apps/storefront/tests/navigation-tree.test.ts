import { describe, expect, it } from 'vitest'

import { readCategorySnapshot } from '@/lib/catalog/category-snapshot'
import { buildBreadcrumbsFromPath } from '@/lib/catalog/build-breadcrumbs'
import {
  buildNavigationTree,
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

describe('buildBreadcrumbsFromPath', () => {
  it('builds trail for subcategory path', () => {
    const crumbs = buildBreadcrumbsFromPath(DEMO_TREE, '/c/escritura/boligrafos')

    expect(crumbs).toHaveLength(3)
    expect(crumbs[0]?.label).toBe('Inicio')
    expect(crumbs[1]?.label).toBe('Escritura y corrección')
    expect(crumbs[1]?.href).toBe('/c/escritura')
    expect(crumbs[2]?.label).toBe('Bolígrafos')
    expect(crumbs[2]?.href).toBeUndefined()
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
    expect(crumbs[3]?.href).toBeUndefined()
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
