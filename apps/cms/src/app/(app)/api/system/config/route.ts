import { getPayload } from 'payload'
import config from '@payload-config'

import { getSystemConfig } from '@/lib/system-config/resolve'

export const dynamic = 'force-dynamic'

export async function GET() {
  const payload = await getPayload({ config })
  const dto = await getSystemConfig(payload)

  return Response.json(dto, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
    },
  })
}
