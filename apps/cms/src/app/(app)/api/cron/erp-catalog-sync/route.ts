import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'

import { runCatalogSyncRead } from '@/erp/ErpCatalogSyncOrchestrator'
import { isWebNativeMode } from '@/lib/web-native-mode'

export const maxDuration = 120

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

/**
 * Scheduled ERP catalog read sync (stub adapter).
 * GET /api/cron/erp-catalog-sync — Vercel Cron with CRON_SECRET.
 */
export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedCron(request)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const payload = await getPayload({ config })

  if (await isWebNativeMode(payload)) {
    return Response.json(
      { success: false, error: 'ERP catalog sync disabled in web-native mode' },
      { status: 410 },
    )
  }

  try {
    const payloadReq = await createLocalReq({}, payload)
    const result = await runCatalogSyncRead({
      payload,
      req: payloadReq,
      actorName: 'cron',
    })
    return Response.json({ success: true, ...result })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Cron ERP catalog sync failed' })
    return Response.json(
      {
        success: false,
        error: e instanceof Error ? e.message : 'Sync failed',
      },
      { status: 503 },
    )
  }
}
