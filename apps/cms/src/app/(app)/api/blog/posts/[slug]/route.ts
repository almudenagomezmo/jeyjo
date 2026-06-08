import { getPayload } from 'payload'
import config from '@payload-config'

import { mapBlogPostDetail } from '@/lib/blog/map-post-dto'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ slug: string }> }

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { slug } = await params
  const normalized = slug.trim().toLowerCase()
  if (!normalized) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const payload = await getPayload({ config })
  const now = new Date()

  const result = await payload.find({
    collection: 'blog-posts',
    where: { slug: { equals: normalized } },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })

  const doc = result.docs[0]
  if (!doc) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const dto = mapBlogPostDetail(doc, now)
  if (!dto) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return Response.json(dto, { headers: CACHE_HEADERS })
}
