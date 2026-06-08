import { describe, expect, it } from 'vitest'

import {
  buildBlogPostsQueryString,
  formatBlogDate,
  parseBlogPageSearchParams,
} from '@/lib/blog/format'

describe('buildBlogPostsQueryString', () => {
  it('builds category and page params', () => {
    expect(buildBlogPostsQueryString({ page: 2, category: 'material-de-oficina' })).toBe(
      '?page=2&category=material-de-oficina',
    )
  })

  it('returns empty string for first page without filters', () => {
    expect(buildBlogPostsQueryString({ page: 1 })).toBe('')
  })
})

describe('parseBlogPageSearchParams', () => {
  it('parses category filter from search params', () => {
    expect(parseBlogPageSearchParams({ category: 'consejos-b2b', page: '3' })).toEqual({
      page: 3,
      category: 'consejos-b2b',
      tag: null,
    })
  })
})

describe('formatBlogDate', () => {
  it('formats ISO date in Spanish locale', () => {
    const formatted = formatBlogDate('2026-06-01T10:00:00.000Z')
    expect(formatted).toMatch(/2026/)
    expect(formatted.toLowerCase()).toMatch(/junio|june/)
  })
})
