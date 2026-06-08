import type { Where } from 'payload'
import { getPayload } from 'payload'
import config from '@payload-config'

import { mapBlogPostListItem, parseBlogListQuery } from '@/lib/blog/map-post-dto'
import { blogPostsPublicWhere } from '@/lib/blog/visibility'

export const dynamic = 'force-dynamic'

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const { page, limit, categorySlug, tag } = parseBlogListQuery(searchParams)
  const now = new Date()
  const payload = await getPayload({ config })

  const and: Where[] = [...blogPostsPublicWhere(now).and]

  if (categorySlug) {
    const categoryResult = await payload.find({
      collection: 'blog-categories',
      where: { slug: { equals: categorySlug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const categoryId = categoryResult.docs[0]?.id
    if (!categoryId) {
      return Response.json(
        {
          docs: [],
          totalDocs: 0,
          page,
          totalPages: 0,
          hasNextPage: false,
          limit,
        },
        { headers: CACHE_HEADERS },
      )
    }
    and.push({ category: { equals: categoryId } })
  }

  if (tag) {
    and.push({ 'tags.tag': { equals: tag } })
  }

  const result = await payload.find({
    collection: 'blog-posts',
    where: { and },
    sort: '-publishedAt',
    page,
    limit,
    depth: 1,
    overrideAccess: true,
  })

  const docs = result.docs
    .map((doc) => mapBlogPostListItem(doc, now))
    .filter((item): item is NonNullable<typeof item> => item != null)

  return Response.json(
    {
      docs,
      totalDocs: result.totalDocs,
      page: result.page ?? page,
      totalPages: result.totalPages ?? 0,
      hasNextPage: result.hasNextPage ?? false,
      limit,
    },
    { headers: CACHE_HEADERS },
  )
}
