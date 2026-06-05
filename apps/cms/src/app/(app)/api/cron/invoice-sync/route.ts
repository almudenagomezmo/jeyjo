import { getPayload } from 'payload'
import config from '@payload-config'

import { runInvoiceSync } from '@/lib/notifications/invoice-sync'

export const maxDuration = 120

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

/**
 * GET /api/cron/invoice-sync — detect new ERP invoices and notify B2B customers.
 */
export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedCron(request)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const payload = await getPayload({ config })

  try {
    const result = await runInvoiceSync(payload)
    return Response.json({ success: true, ...result })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Cron invoice sync failed' })
    return Response.json(
      {
        success: false,
        error: e instanceof Error ? e.message : 'Sync failed',
      },
      { status: 503 },
    )
  }
}
