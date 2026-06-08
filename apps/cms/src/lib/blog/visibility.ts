import type { Where } from 'payload'

export function isBlogPostVisible(
  published: boolean | null | undefined,
  publishedAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (published !== true) return false
  if (!publishedAt) return false
  const at = new Date(publishedAt)
  if (Number.isNaN(at.getTime())) return false
  return at.getTime() <= now.getTime()
}

export function blogPostsPublicWhere(now: Date = new Date()): { and: Where[] } {
  return {
    and: [
      { published: { equals: true } },
      { publishedAt: { less_than_equal: now.toISOString() } },
    ],
  }
}
