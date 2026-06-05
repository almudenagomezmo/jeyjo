import { getPayload } from 'payload'
import config from '@payload-config'

import { runQuoteExpiryNotifications } from '@/lib/notifications/quote-expiry'

export const maxDuration = 120

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

/**
 * GET /api/cron/quote-expiry-notifications — daily quote expiry warnings (RF-022c).
 */
export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedCron(request)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const payload = await getPayload({ config })

  try {
    const result = await runQuoteExpiryNotifications(payload)
    return Response.json({ success: true, ...result })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Cron quote expiry notifications failed' })
    return Response.json(
      {
        success: false,
        error: e instanceof Error ? e.message : 'Job failed',
      },
      { status: 503 },
    )
  }
}
