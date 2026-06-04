import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

import { checkRole } from '@/access/utilities'
import { runSearchIndexerBatch } from '@/search-indexer/worker'

export const maxDuration = 120

/**
 * Manual dev trigger: drain pending search_events into Qdrant.
 * POST /next/process-search-events (admin auth). Production uses /api/cron/search-indexer.
 */
export async function POST(): Promise<Response> {
  if (process.env.NODE_ENV === 'production') {
    return new Response('process-search-events is disabled in production.', { status: 403 })
  }

  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || !checkRole(['admin'], user)) {
    return new Response('Action forbidden.', { status: 403 })
  }

  try {
    const payloadReq = await createLocalReq({ user }, payload)
    const result = await runSearchIndexerBatch({
      payload,
      req: payloadReq,
      logger: payload.logger,
    })
    return Response.json({ success: true, ...result })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Manual search indexer failed' })
    return new Response('Error processing search events.', { status: 500 })
  }
}
