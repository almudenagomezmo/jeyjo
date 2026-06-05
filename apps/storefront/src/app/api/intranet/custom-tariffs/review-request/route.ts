import { NextResponse } from 'next/server'

import { requireB2bApiSession } from '@/lib/intranet/b2b-api-guard'
import { submitPriceReviewRequest } from '@/lib/intranet/custom-tariffs/review-request'

export async function POST(request: Request) {
  const guard = await requireB2bApiSession({ section: 'orders' })
  if ('error' in guard) return guard.error

  let body: { sku?: string }
  try {
    body = (await request.json()) as { sku?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = await submitPriceReviewRequest(guard.customerId, body.sku ?? '')
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({
    quoteNumber: result.quoteNumber,
    message: 'Solicitud registrada. Nuestro equipo revisará tu tarifa.',
  })
}
