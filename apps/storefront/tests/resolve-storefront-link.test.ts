import { describe, expect, it } from 'vitest'

import { findCategorySlugPathInTree } from '@/lib/catalog/build-breadcrumbs'
import { resolveStorefrontLink } from '@/lib/cms/resolve-storefront-link'

const DEMO_TREE = [
  {
    slug: 'escritura',
    title: 'Escritura',
    glyph: 'pen' as const,
    children: [
      {
        slug: 'boligrafos',
        title: 'Bolígrafos',
        children: [],
      },
    ],
  },
  {
    slug: 'reciclaje',
    title: 'Reciclaje',
    glyph: 'recycle' as const,
    children: [],
  },
]

describe('resolveStorefrontLink', () => {
  it('resolves product slug', () => {
    expect(
      resolveStorefrontLink({
        type: 'reference',
        reference: {
          relationTo: 'products',
          value: { slug: 'bic-cristal' },
        },
      }),
    ).toBe('/p/bic-cristal')
  })

  it('resolves category with full path from navigation tree', () => {
    expect(
      resolveStorefrontLink(
        {
          type: 'reference',
          reference: {
            relationTo: 'categories',
            value: { slug: 'boligrafos' },
          },
        },
        DEMO_TREE,
      ),
    ).toBe('/c/escritura/boligrafos')
  })

  it('falls back to root category path when tree is unavailable', () => {
    expect(
      resolveStorefrontLink({
        type: 'reference',
        reference: {
          relationTo: 'categories',
          value: { slug: 'reciclaje' },
        },
      }),
    ).toBe('/c/reciclaje')
  })

  it('resolves custom internal and external URLs', () => {
    expect(
      resolveStorefrontLink({
        type: 'custom',
        url: '/search?q=eco',
      }),
    ).toBe('/search?q=eco')

    expect(
      resolveStorefrontLink({
        type: 'custom',
        url: 'https://jeyjo.es/ofertas',
      }),
    ).toBe('https://jeyjo.es/ofertas')
  })

  it('returns null when reference is missing slug', () => {
    expect(
      resolveStorefrontLink({
        type: 'reference',
        reference: { relationTo: 'categories', value: { slug: '' } },
      }),
    ).toBeNull()
  })
})

describe('findCategorySlugPathInTree (banner paths)', () => {
  it('finds nested slug path used by banner resolver', () => {
    expect(findCategorySlugPathInTree(DEMO_TREE, 'boligrafos')).toEqual([
      'escritura',
      'boligrafos',
    ])
  })
})
