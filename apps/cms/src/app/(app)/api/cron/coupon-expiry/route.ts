import { getPayload } from 'payload'
import config from '@payload-config'

import { deactivateExpiredCoupons } from '@/lib/coupons/expiry'

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

export const maxDuration = 60

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedCron(request)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const payload = await getPayload({ config })
  try {
    const result = await deactivateExpiredCoupons(payload)
    return Response.json({ success: true, ...result })
  } catch (e) {
    payload.logger.error({ msg: 'coupon-expiry cron failed', err: e })
    return new Response('Job failed', { status: 503 })
  }
}
