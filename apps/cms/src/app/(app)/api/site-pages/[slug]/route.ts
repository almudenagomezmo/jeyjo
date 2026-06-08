import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ slug: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
  const { slug } = await params
  const normalized = slug.trim().toLowerCase()
  if (!normalized) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'site-pages',
    where: {
      and: [{ slug: { equals: normalized } }, { published: { equals: true } }],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const doc = result.docs[0]
  if (!doc) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return Response.json(
    {
      slug: doc.slug,
      title: doc.title,
      pageType: doc.pageType,
      content: doc.content,
      metaDescription: doc.metaDescription ?? null,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    },
  )
}
