import { getPayload } from 'payload'
import config from '@payload-config'

import { runSearchOrphanCleanup } from '@/search-indexer/orphanCleanup'

export const maxDuration = 120

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

/**
 * Daily orphan cleanup for Qdrant points without valid Payload documents.
 * GET /api/cron/search-orphan-cleanup — Vercel Cron with CRON_SECRET.
 */
export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedCron(request)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const payload = await getPayload({ config })

  try {
    const result = await runSearchOrphanCleanup(payload)
    payload.logger.info(result, 'Search orphan cleanup finished')
    return Response.json({ success: true, ...result })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Cron search orphan cleanup failed' })
    return Response.json(
      {
        success: false,
        error: e instanceof Error ? e.message : 'Search orphan cleanup failed',
      },
      { status: 503 },
    )
  }
}
