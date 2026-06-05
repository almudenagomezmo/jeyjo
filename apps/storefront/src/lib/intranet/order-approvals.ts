import { updateOrderPaymentStatus } from '@/lib/payments/payload-orders'

export type PendingApprovalOrder = {
  id: number
  orderNumber: string
  amount: number
  createdAt: string
  submittedByUserId: string | null
  submittedByEmail: string | null
  customerNotes: string | null
}

function payloadBaseUrl(): string | null {
  return (
    process.env.CMS_INTERNAL_URL ??
    process.env.CMS_URL ??
    process.env.NEXT_PUBLIC_PAYLOAD_URL ??
    null
  )
}

function payloadHeaders(): HeadersInit | null {
  const apiKey = process.env.STOREFRONT_PAYLOAD_API_KEY
  if (!apiKey) return null
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }
}

export async function listPendingCompanyApprovalOrders(
  customerId: string,
): Promise<PendingApprovalOrder[]> {
  const base = payloadBaseUrl()
  const headers = payloadHeaders()
  if (!base || !headers) return []

  const params = new URLSearchParams({
    'where[customerRef][equals]': customerId,
    'where[jeyjoStatus][equals]': 'pending_company_approval',
    limit: '50',
    sort: '-createdAt',
    depth: '0',
  })

  const res = await fetch(`${base.replace(/\/$/, '')}/api/orders?${params}`, {
    headers,
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return []

  const data = (await res.json()) as {
    docs?: Array<{
      id?: number
      orderNumber?: string
      amount?: number
      createdAt?: string
      submittedByUserId?: string | null
      submittedByEmail?: string | null
      customerNotes?: string | null
    }>
  }

  return (data.docs ?? [])
    .filter((doc) => doc.id && doc.orderNumber)
    .map((doc) => ({
      id: doc.id!,
      orderNumber: doc.orderNumber!,
      amount: doc.amount ?? 0,
      createdAt: doc.createdAt ?? '',
      submittedByUserId: doc.submittedByUserId ?? null,
      submittedByEmail: doc.submittedByEmail ?? null,
      customerNotes: doc.customerNotes ?? null,
    }))
}

export async function countPendingCompanyApprovalOrders(customerId: string): Promise<number> {
  const orders = await listPendingCompanyApprovalOrders(customerId)
  return orders.length
}

export async function approveCompanyOrder(orderId: number): Promise<boolean> {
  return updateOrderPaymentStatus({
    orderId,
    jeyjoStatus: 'pending_confirmation',
  })
}

export async function rejectCompanyOrder(orderId: number): Promise<boolean> {
  return updateOrderPaymentStatus({
    orderId,
    jeyjoStatus: 'cancelled',
  })
}

export async function getCompanyOrderForApproval(
  customerId: string,
  orderId: number,
): Promise<PendingApprovalOrder | null> {
  const base = payloadBaseUrl()
  const headers = payloadHeaders()
  if (!base || !headers) return null

  const res = await fetch(`${base.replace(/\/$/, '')}/api/orders/${orderId}`, {
    headers,
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) return null

  const doc = (await res.json()) as {
    id?: number
    orderNumber?: string
    customerRef?: string
    jeyjoStatus?: string
    amount?: number
    createdAt?: string
    submittedByUserId?: string | null
    submittedByEmail?: string | null
    customerNotes?: string | null
  }

  if (
    !doc.id ||
    !doc.orderNumber ||
    doc.customerRef !== customerId ||
    doc.jeyjoStatus !== 'pending_company_approval'
  ) {
    return null
  }

  return {
    id: doc.id,
    orderNumber: doc.orderNumber,
    amount: doc.amount ?? 0,
    createdAt: doc.createdAt ?? '',
    submittedByUserId: doc.submittedByUserId ?? null,
    submittedByEmail: doc.submittedByEmail ?? null,
    customerNotes: doc.customerNotes ?? null,
  }
}
