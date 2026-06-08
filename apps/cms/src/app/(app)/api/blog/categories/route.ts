import { getPayload } from 'payload'
import config from '@payload-config'

import { mapBlogCategoryListItem } from '@/lib/blog/map-post-dto'
import { blogPostsPublicWhere } from '@/lib/blog/visibility'

export const dynamic = 'force-dynamic'

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
}

export async function GET() {
  const payload = await getPayload({ config })
  const now = new Date()

  const posts = await payload.find({
    collection: 'blog-posts',
    where: blogPostsPublicWhere(now),
    limit: 500,
    depth: 1,
    overrideAccess: true,
  })

  const seen = new Map<string, { slug: string; name: string }>()
  for (const post of posts.docs) {
    const category = post.category
    if (!category || typeof category === 'number') continue
    if (!category.slug || !category.name) continue
    seen.set(category.slug, mapBlogCategoryListItem(category))
  }

  const categories = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'))

  return Response.json({ categories }, { headers: CACHE_HEADERS })
}
