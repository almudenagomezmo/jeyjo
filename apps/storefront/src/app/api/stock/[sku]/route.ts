import { getStockIndicator } from '@/lib/stock/get-stock-indicator'

type RouteContext = { params: Promise<{ sku: string }> }

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { sku } = await context.params
  const indicator = await getStockIndicator(decodeURIComponent(sku))

  if (!indicator) {
    return Response.json({ error: 'not_found' }, { status: 404 })
  }

  return Response.json(indicator)
}
