import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'

import { runSearchReconcile } from '@/search-indexer/reconcile'

export const maxDuration = 120

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

/**
 * Hourly reconciliation: stale catalog entities + recent error retries.
 * GET /api/cron/search-reconcile — Vercel Cron with CRON_SECRET.
 */
export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedCron(request)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const payload = await getPayload({ config })

  try {
    const result = await runSearchReconcile(payload)
    return Response.json({ success: true, ...result })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Cron search reconcile failed' })
    return Response.json(
      {
        success: false,
        error: e instanceof Error ? e.message : 'Search reconcile failed',
      },
      { status: 503 },
    )
  }
}
