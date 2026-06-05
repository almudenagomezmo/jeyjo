import { NextResponse } from 'next/server'

import { fetchSystemConfigUncached } from '@/lib/system-config/fetch-internal'

export async function GET() {
  const config = await fetchSystemConfigUncached()
  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
    },
  })
}
