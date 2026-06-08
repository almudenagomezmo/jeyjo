import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

import { checkRole } from '@/access/utilities'
import { isWebNativeMode } from '@/lib/web-native-mode'
import { runStockSync } from '@/stock/StockSyncOrchestrator'

export const maxDuration = 120

/**
 * Manual dev trigger: wholesale stock sync via stub adapters.
 * POST /next/sync-stock-from-stub (admin auth). Production uses /api/cron/stock-sync.
 */
export async function POST(): Promise<Response> {
  if (process.env.NODE_ENV === 'production') {
    return new Response('sync-stock-from-stub is disabled in production.', { status: 403 })
  }

  const payload = await getPayload({ config })

  if (await isWebNativeMode(payload)) {
    return Response.json(
      { success: false, error: 'Stock sync disabled in web-native mode' },
      { status: 410 },
    )
  }

  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || !checkRole(['admin'], user)) {
    return new Response('Action forbidden.', { status: 403 })
  }

  try {
    const payloadReq = await createLocalReq({ user }, payload)
    const result = await runStockSync({
      payload,
      req: payloadReq,
      actorName: user.email ?? user.id?.toString() ?? 'admin',
    })
    return Response.json({ success: true, ...result })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Error syncing stock from stub' })
    return new Response('Error syncing stock from stub.', { status: 500 })
  }
}
