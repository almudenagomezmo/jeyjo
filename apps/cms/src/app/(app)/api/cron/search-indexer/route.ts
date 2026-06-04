import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'

import { runSearchIndexerBatch } from '@/search-indexer/worker'

export const maxDuration = 120

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

/**
 * Scheduled search indexer worker (RF-009).
 * GET /api/cron/search-indexer — Vercel Cron with CRON_SECRET.
 */
export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedCron(request)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const payload = await getPayload({ config })

  try {
    const payloadReq = await createLocalReq({}, payload)
    const result = await runSearchIndexerBatch({
      payload,
      req: payloadReq,
      logger: payload.logger,
    })
    return Response.json({ success: true, ...result })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Cron search indexer failed' })
    return Response.json(
      {
        success: false,
        error: e instanceof Error ? e.message : 'Search indexer failed',
      },
      { status: 503 },
    )
  }
}
