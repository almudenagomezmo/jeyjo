import type { BlogListQuery } from './types'

export function buildBlogPostsQueryString(query: BlogListQuery): string {
  const params = new URLSearchParams()
  const page = query.page ?? 1
  if (page > 1) params.set('page', String(page))
  if (query.category) params.set('category', query.category)
  if (query.tag) params.set('tag', query.tag)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export function parseBlogPageSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): BlogListQuery {
  const pageRaw = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page
  const categoryRaw = Array.isArray(searchParams.category)
    ? searchParams.category[0]
    : searchParams.category
  const tagRaw = Array.isArray(searchParams.tag) ? searchParams.tag[0] : searchParams.tag

  const page = Number.parseInt(pageRaw ?? '1', 10)
  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    category: categoryRaw?.trim().toLowerCase() || null,
    tag: tagRaw?.trim().toLowerCase() || null,
  }
}

export function formatBlogDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}
