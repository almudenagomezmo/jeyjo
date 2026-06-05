import { NextResponse } from 'next/server'

import { pricingCustomerGroup } from '@/lib/auth/customer-context'
import { requireB2bApiSession } from '@/lib/intranet/b2b-api-guard'
import { fetchB2bCatalogDownloads } from '@/lib/intranet/catalog-downloads/fetch-catalog-downloads'

export async function GET() {
  const guard = await requireB2bApiSession({ section: 'orders' })
  if ('error' in guard) return guard.error

  const items = await fetchB2bCatalogDownloads({
    customerGroup: pricingCustomerGroup(guard.ctx),
  })

  return NextResponse.json({ items })
}
