import { getPayload } from 'payload'
import config from '@payload-config'

import { merchantFeedEnabled } from '@/lib/feeds/merchant-center/storage'
import { recordMerchantFeedFailure, runMerchantFeedJob } from '@/lib/feeds/merchant-center/run'

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

export const maxDuration = 120

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedCron(request)) {
    return new Response('Unauthorized', { status: 401 })
  }

  if (!merchantFeedEnabled()) {
    return Response.json({ success: false, skipped: true, reason: 'MERCHANT_FEED_ENABLED=false' })
  }

  const payload = await getPayload({ config })
  try {
    const result = await runMerchantFeedJob(payload)
    return Response.json({ success: true, ...result })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    payload.logger.error({ msg: 'merchant-feed cron failed', err: e })
    const failures = await recordMerchantFeedFailure(payload, message)
    return Response.json({ success: false, error: message, consecutiveFeedFailures: failures }, { status: 503 })
  }
}
