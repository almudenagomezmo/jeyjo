import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

import { checkRole } from '@/access/utilities'
import { runSearchBackfill } from '@/search-indexer/backfill'

export const maxDuration = 120

/**
 * Enqueue all publishable catalog entities for Qdrant indexing.
 * POST /next/search-backfill (admin auth). Does not embed inline.
 */
export async function POST(): Promise<Response> {
  if (process.env.NODE_ENV === 'production') {
    return new Response('search-backfill is disabled in production.', { status: 403 })
  }

  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || !checkRole(['admin'], user)) {
    return new Response('Action forbidden.', { status: 403 })
  }

  try {
    const payloadReq = await createLocalReq({ user }, payload)
    const result = await runSearchBackfill(payload)
    payload.logger.info({ ...result, req: payloadReq.transactionID }, 'Manual search backfill finished')
    return Response.json({ success: true, ...result })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Manual search backfill failed' })
    return new Response('Error running search backfill.', { status: 500 })
  }
}
