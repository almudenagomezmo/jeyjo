import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

import { checkRole } from '@/access/utilities'
import { syncCatalogFromStubAdapter } from '@/erp/syncFromStub'

export const maxDuration = 120

/**
 * Manual dev trigger: pull catalog from stub ERP adapter into Payload.
 * POST /next/sync-from-stub (admin auth). No cron — see change #7.
 */
export async function POST(): Promise<Response> {
  if (process.env.NODE_ENV === 'production') {
    return new Response('sync-from-stub is disabled in production.', { status: 403 })
  }

  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || !checkRole(['admin'], user)) {
    return new Response('Action forbidden.', { status: 403 })
  }

  try {
    const payloadReq = await createLocalReq({ user }, payload)
    const result = await syncCatalogFromStubAdapter({ payload, req: payloadReq })
    return Response.json({ success: true, ...result })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Error syncing from stub ERP' })
    return new Response('Error syncing from stub ERP.', { status: 500 })
  }
}
