import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'

import { isWebNativeMode } from '@/lib/web-native-mode'
import { runStockSync } from '@/stock/StockSyncOrchestrator'

export const maxDuration = 120

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

/**
 * Scheduled wholesale stock sync (stub adapters).
 * GET /api/cron/stock-sync — Vercel Cron with CRON_SECRET.
 */
export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedCron(request)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const payload = await getPayload({ config })

  if (await isWebNativeMode(payload)) {
    return Response.json(
      { success: false, error: 'Stock sync disabled in web-native mode' },
      { status: 410 },
    )
  }

  try {
    const payloadReq = await createLocalReq({}, payload)
    const result = await runStockSync({
      payload,
      req: payloadReq,
      actorName: 'cron',
    })
    return Response.json({ success: true, ...result })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Cron stock sync failed' })
    return Response.json(
      {
        success: false,
        error: e instanceof Error ? e.message : 'Sync failed',
      },
      { status: 503 },
    )
  }
}
