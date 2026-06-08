import type { BlogCategory, BlogPost, Media } from '@/payload-types'

import { buildExcerpt } from './excerpt'
import { mediaUrlFromDoc } from './media-url'
import { isBlogPostVisible } from './visibility'

export type BlogCategoryDto = {
  slug: string
  name: string
}

export type BlogPostListItemDto = {
  slug: string
  title: string
  excerpt: string
  publishedAt: string
  authorName: string
  tags: string[]
  category: BlogCategoryDto
  featuredImageUrl: string | null
}

export type BlogPostDetailDto = BlogPostListItemDto & {
  content: unknown
  metaDescription: string | null
}

function resolveCategory(category: BlogPost['category']): BlogCategoryDto | null {
  if (!category || typeof category === 'number') return null
  const doc = category as BlogCategory
  if (!doc.slug || !doc.name) return null
  return { slug: doc.slug, name: doc.name }
}

function normalizeTags(tags: BlogPost['tags']): string[] {
  if (!Array.isArray(tags)) return []
  return tags
    .map((entry) => (typeof entry?.tag === 'string' ? entry.tag.trim().toLowerCase() : ''))
    .filter(Boolean)
}

export function mapBlogPostListItem(
  doc: BlogPost,
  now: Date = new Date(),
): BlogPostListItemDto | null {
  if (!isBlogPostVisible(doc.published, doc.publishedAt, now)) return null

  const category = resolveCategory(doc.category)
  if (!category) return null

  const publishedAt = doc.publishedAt
  if (!publishedAt) return null

  return {
    slug: doc.slug,
    title: doc.title,
    excerpt: buildExcerpt(doc.excerpt, doc.content),
    publishedAt,
    authorName: doc.authorName?.trim() || 'Equipo Jeyjo',
    tags: normalizeTags(doc.tags),
    category,
    featuredImageUrl: mediaUrlFromDoc(doc.featuredImage as Media | number | null),
  }
}

export function mapBlogPostDetail(
  doc: BlogPost,
  now: Date = new Date(),
): BlogPostDetailDto | null {
  const base = mapBlogPostListItem(doc, now)
  if (!base) return null

  return {
    ...base,
    content: doc.content,
    metaDescription: doc.metaDescription?.trim() || null,
  }
}

export function mapBlogCategoryListItem(doc: BlogCategory): BlogCategoryDto {
  return {
    slug: doc.slug,
    name: doc.name,
  }
}

export function parseBlogListQuery(searchParams: URLSearchParams): {
  page: number
  limit: number
  categorySlug: string | null
  tag: string | null
} {
  const pageRaw = Number.parseInt(searchParams.get('page') ?? '1', 10)
  const limitRaw = Number.parseInt(searchParams.get('limit') ?? '12', 10)
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 24) : 12
  const categorySlug = searchParams.get('category')?.trim().toLowerCase() || null
  const tag = searchParams.get('tag')?.trim().toLowerCase() || null

  return { page, limit, categorySlug, tag }
}
