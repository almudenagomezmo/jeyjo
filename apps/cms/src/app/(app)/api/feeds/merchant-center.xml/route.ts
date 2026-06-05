import { getPayload } from 'payload'
import config from '@payload-config'

import {
  loadMerchantFeedSnapshot,
  merchantFeedEnabled,
  uploadMerchantFeedSnapshot,
} from '@/lib/feeds/merchant-center/storage'
import { buildMerchantFeed } from '@/lib/feeds/merchant-center/fetch-catalog'

async function isGlobalFeedEnabled(payload: Awaited<ReturnType<typeof getPayload>>): Promise<boolean> {
  try {
    const global = await payload.findGlobal({ slug: 'analyticsSettings', overrideAccess: true })
    return global.merchantFeedEnabled !== false
  } catch {
    return true
  }
}

export async function GET(request: Request): Promise<Response> {
  if (!merchantFeedEnabled()) {
    return new Response('Feed disabled', { status: 404 })
  }

  const payload = await getPayload({ config })
  if (!(await isGlobalFeedEnabled(payload))) {
    return new Response('Feed disabled', { status: 404 })
  }

  const url = new URL(request.url)
  const refresh = url.searchParams.get('refresh') === '1'
  const cronSecret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  const authorizedRefresh = Boolean(cronSecret && auth === `Bearer ${cronSecret}`)

  let snapshot = refresh && authorizedRefresh ? null : await loadMerchantFeedSnapshot()

  if (!snapshot) {
    if (refresh && !authorizedRefresh) {
      return new Response('Unauthorized refresh', { status: 401 })
    }
    const built = await buildMerchantFeed(payload)
    const generatedAt = new Date().toISOString()
    const meta = await uploadMerchantFeedSnapshot(built.xml, {
      generatedAt,
      rowCount: built.rows.length,
    })
    snapshot = { xml: built.xml, meta }
  }

  return new Response(snapshot.xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      ETag: snapshot.meta.etag,
      'Last-Modified': new Date(snapshot.meta.generatedAt).toUTCString(),
    },
  })
}
