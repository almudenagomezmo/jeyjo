import { describe, expect, it } from 'vitest'

import type { BlogPost } from '@/payload-types'

import { canReadCollection, canWriteCollection } from '@/access/staffRoles'
import { buildExcerpt, extractPlainTextFromLexical } from '@/lib/blog/excerpt'
import { mapBlogPostListItem, parseBlogListQuery } from '@/lib/blog/map-post-dto'
import { isBlogPostVisible } from '@/lib/blog/visibility'
import { normalizeBlogPostTags, validateBlogPostPublishRules } from '@/hooks/blogPostHooks'

describe('blog visibility', () => {
  it('requires published and past publishedAt', () => {
    const now = new Date('2026-06-08T12:00:00.000Z')
    expect(isBlogPostVisible(true, '2026-06-07T12:00:00.000Z', now)).toBe(true)
    expect(isBlogPostVisible(true, '2026-06-09T12:00:00.000Z', now)).toBe(false)
    expect(isBlogPostVisible(false, '2026-06-01T12:00:00.000Z', now)).toBe(false)
  })
})

describe('blog excerpt', () => {
  it('extracts plain text from lexical', () => {
    const text = extractPlainTextFromLexical({
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', text: 'Hola mundo editorial' }],
          },
        ],
      },
    })
    expect(text).toBe('Hola mundo editorial')
  })

  it('truncates generated excerpt', () => {
    const long = 'a'.repeat(200)
    const excerpt = buildExcerpt(null, {
      root: {
        type: 'root',
        children: [{ type: 'paragraph', children: [{ type: 'text', text: long }] }],
      },
    })
    expect(excerpt.endsWith('…')).toBe(true)
  })
})

describe('blog list query parsing', () => {
  it('caps limit at 24', () => {
    const params = new URLSearchParams('page=2&limit=99&category=oficina&tag=b2b')
    expect(parseBlogListQuery(params)).toEqual({
      page: 2,
      limit: 24,
      categorySlug: 'oficina',
      tag: 'b2b',
    })
  })
})

describe('blog post DTO mapping', () => {
  it('maps visible post with category and tags', () => {
    const now = new Date('2026-06-08T12:00:00.000Z')
    const dto = mapBlogPostListItem(
      {
        id: 1,
        title: 'Test',
        slug: 'test',
        category: { id: 2, name: 'Oficina', slug: 'oficina', updatedAt: '', createdAt: '' },
        tags: [{ tag: 'B2B', id: '1' }],
        featuredImage: { id: 3, url: '/media/hero.jpg', alt: 'hero', updatedAt: '', createdAt: '' },
        content: { root: { type: 'root', children: [], direction: 'ltr', format: '', indent: 0, version: 1 } },
        authorName: 'Equipo Jeyjo',
        published: true,
        publishedAt: '2026-06-07T10:00:00.000Z',
        updatedAt: '',
        createdAt: '',
      } as BlogPost,
      now,
    )

    expect(dto?.slug).toBe('test')
    expect(dto?.category.slug).toBe('oficina')
    expect(dto?.tags).toEqual(['b2b'])
    expect(dto?.featuredImageUrl).toContain('/media/hero.jpg')
  })

  it('returns null for scheduled post', () => {
    const now = new Date('2026-06-08T12:00:00.000Z')
    const dto = mapBlogPostListItem(
      {
        id: 1,
        title: 'Future',
        slug: 'future',
        category: { id: 2, name: 'Oficina', slug: 'oficina', updatedAt: '', createdAt: '' },
        content: { root: { type: 'root', children: [], direction: 'ltr', format: '', indent: 0, version: 1 } },
        authorName: 'Equipo Jeyjo',
        published: true,
        publishedAt: '2026-06-15T10:00:00.000Z',
        updatedAt: '',
        createdAt: '',
      } as BlogPost,
      now,
    )
    expect(dto).toBeNull()
  })
})

describe('blog staff access', () => {
  const personalizationUser = {
    staffRoles: ['personalizacion'],
  } as unknown as import('@/payload-types').User
  const catalogUser = { staffRoles: ['catalogo'] } as unknown as import('@/payload-types').User

  it('personalizacion can manage blog posts', () => {
    expect(canReadCollection(personalizationUser, 'blog-posts')).toBe(true)
    expect(canWriteCollection(personalizationUser, 'blog-posts', 'create')).toBe(true)
  })

  it('catalogo-only staff denied', () => {
    expect(canReadCollection(catalogUser, 'blog-posts')).toBe(false)
  })
})

describe('blog post hooks', () => {
  it('normalizes tags to lowercase', () => {
    const data = normalizeBlogPostTags({
      data: { tags: [{ tag: ' Oficina ' }, { tag: '' }] },
    } as unknown as Parameters<typeof normalizeBlogPostTags>[0])
    expect((data as { tags: Array<{ tag: string }> }).tags).toEqual([{ tag: 'oficina' }])
  })

  it('defaults publishedAt when publishing', () => {
    const data = validateBlogPostPublishRules({
      data: { published: true, featuredImage: 1 },
    } as unknown as Parameters<typeof validateBlogPostPublishRules>[0])
    expect((data as { publishedAt?: string }).publishedAt).toBeTruthy()
  })

  it('rejects publish without featured image', () => {
    expect(() =>
      validateBlogPostPublishRules({
        data: { published: true },
      } as unknown as Parameters<typeof validateBlogPostPublishRules>[0]),
    ).toThrow(/imagen destacada/)
  })
})
