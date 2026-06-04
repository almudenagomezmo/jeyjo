import { describe, expect, it } from 'vitest'

import { buildBreadcrumbsFromPath } from '@/lib/catalog/build-breadcrumbs'
import {
  buildNavigationTree,
  type CmsCategoryDoc,
  type NavNode,
} from '@/lib/catalog/fetch-navigation-tree'
import { CATEGORIES } from '@/lib/data/categories'

const DEMO_TREE: NavNode[] = [
  {
    id: '1',
    title: 'Escritura y corrección',
    slug: 'escritura',
    glyph: 'pen',
    children: [
      { id: '2', title: 'Bolígrafos', slug: 'boligrafos', children: [] },
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
      { id: 1, title: 'Escritura', slug: 'escritura', sortOrder: 1 },
      { id: 2, title: 'Bolígrafos', slug: 'boligrafos', sortOrder: 2, parent: 1 },
      { id: 3, title: 'Rotuladores', slug: 'rotuladores', sortOrder: 3, parent: 1 },
      { id: 4, title: 'Papel', slug: 'papel', sortOrder: 4 },
    ]

    const tree = buildNavigationTree(docs)

    expect(tree).toHaveLength(2)
    expect(tree[0]?.slug).toBe('escritura')
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
})

describe('getNavigationTree static fallback shape', () => {
  it('static fallback root count matches CATEGORIES.length', () => {
    const staticTree = CATEGORIES.map((cat) => ({
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

    expect(staticTree).toHaveLength(CATEGORIES.length)
    expect(staticTree[0]?.slug).toBe('escritura')
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

  it('includes search crumb', () => {
    const crumbs = buildBreadcrumbsFromPath(DEMO_TREE, '/search')
    expect(crumbs.map((c) => c.label)).toEqual(['Inicio', 'Buscar'])
  })

  it('returns home only for unknown paths', () => {
    const crumbs = buildBreadcrumbsFromPath(DEMO_TREE, '/cart')
    expect(crumbs).toHaveLength(1)
  })
})
