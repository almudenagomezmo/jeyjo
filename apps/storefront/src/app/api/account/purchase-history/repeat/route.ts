import { requireCustomerApiSession } from '@/lib/auth/customer-api-guard'
import { repeatPurchaseHistoryItems } from '@/lib/intranet/purchase-history/repeat-items'

export async function POST(request: Request) {
  const guard = await requireCustomerApiSession()
  if ('error' in guard) return guard.error

  return repeatPurchaseHistoryItems(guard.customerId, request)
}
