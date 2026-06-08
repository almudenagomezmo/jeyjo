import type { CollectionBeforeValidateHook } from 'payload'

type BlogPostLike = {
  published?: boolean | null
  publishedAt?: string | null
  featuredImage?: unknown
  tags?: Array<{ tag?: string | null; id?: string }> | null
}

export const normalizeBlogPostTags: CollectionBeforeValidateHook = ({ data }) => {
  if (!data || typeof data !== 'object') return data

  const row = data as BlogPostLike
  if (!Array.isArray(row.tags)) return data

  const normalized = row.tags
    .map((entry) => {
      const raw = typeof entry?.tag === 'string' ? entry.tag.trim().toLowerCase() : ''
      return raw ? { ...entry, tag: raw } : null
    })
    .filter(Boolean)

  return { ...row, tags: normalized }
}

export const validateBlogPostPublishRules: CollectionBeforeValidateHook = ({ data }) => {
  if (!data || typeof data !== 'object') return data

  const row = data as BlogPostLike
  const published = row.published === true

  if (published && !row.publishedAt) {
    row.publishedAt = new Date().toISOString()
  }

  if (published && !row.featuredImage) {
    throw new Error('La imagen destacada es obligatoria para publicar un artículo.')
  }

  return row
}
