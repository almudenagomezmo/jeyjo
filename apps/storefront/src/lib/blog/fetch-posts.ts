import { unstable_cache } from 'next/cache'

import { buildBlogPostsQueryString } from './format'
import type {
  BlogCategoriesResponse,
  BlogListQuery,
  BlogPostDetailDto,
  BlogPostsListResponse,
} from './types'

function cmsBaseUrl(): string | null {
  return (
    process.env.CMS_INTERNAL_URL ??
    process.env.CMS_URL ??
    process.env.NEXT_PUBLIC_PAYLOAD_URL ??
    null
  )
}

export async function fetchBlogPostsUncached(
  query: BlogListQuery = {},
): Promise<BlogPostsListResponse | null> {
  const base = cmsBaseUrl()
  if (!base) return null

  const qs = buildBlogPostsQueryString(query)

  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/blog/posts${qs}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null
    return (await res.json()) as BlogPostsListResponse
  } catch {
    return null
  }
}

export function fetchBlogPosts(query: BlogListQuery = {}): Promise<BlogPostsListResponse | null> {
  const cacheKey = ['blog-posts', String(query.page ?? 1), query.category ?? '', query.tag ?? '']
  return unstable_cache(() => fetchBlogPostsUncached(query), cacheKey, { revalidate: 300 })()
}

export async function fetchBlogCategoriesUncached(): Promise<BlogCategoriesResponse | null> {
  const base = cmsBaseUrl()
  if (!base) return null

  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/blog/categories`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null
    return (await res.json()) as BlogCategoriesResponse
  } catch {
    return null
  }
}

export function fetchBlogCategories(): Promise<BlogCategoriesResponse | null> {
  return unstable_cache(fetchBlogCategoriesUncached, ['blog-categories'], { revalidate: 300 })()
}

export async function fetchBlogPostUncached(slug: string): Promise<BlogPostDetailDto | null> {
  const base = cmsBaseUrl()
  if (!base) return null
  const normalized = slug.trim().toLowerCase()
  if (!normalized) return null

  try {
    const res = await fetch(
      `${base.replace(/\/$/, '')}/api/blog/posts/${encodeURIComponent(normalized)}`,
      {
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(4000),
      },
    )
    if (!res.ok) return null
    return (await res.json()) as BlogPostDetailDto
  } catch {
    return null
  }
}

export function fetchBlogPost(slug: string): Promise<BlogPostDetailDto | null> {
  return unstable_cache(
    () => fetchBlogPostUncached(slug),
    ['blog-post', slug.trim().toLowerCase()],
    { revalidate: 300 },
  )()
}
