import type {
  CreateRmaInput,
  CreateRmaResult,
  RmaIncidentRow,
  RmaListFilter,
  RmaListResult,
} from '@/lib/intranet/rma/types'

function payloadBaseUrl(): string | null {
  return (
    process.env.CMS_INTERNAL_URL ??
    process.env.CMS_URL ??
    process.env.NEXT_PUBLIC_PAYLOAD_URL ??
    null
  )
}

function apiKey(): string | undefined {
  return process.env.STOREFRONT_PAYLOAD_API_KEY
}

export async function createPayloadRmaIncident(
  customerId: string,
  customerEmail: string | null,
  input: CreateRmaInput,
): Promise<CreateRmaResult> {
  const base = payloadBaseUrl()
  const key = apiKey()
  if (!base || !key) {
    throw new Error('CMS not configured')
  }

  const res = await fetch(`${base.replace(/\/$/, '')}/api/rma-incidents/storefront-create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      customerRef: customerId,
      customerEmail,
      articleSku: input.articleSku.trim(),
      deliveryNoteNumber: input.deliveryNoteNumber.trim(),
      reason: input.reason,
      observations: input.observations?.trim() || null,
    }),
    signal: AbortSignal.timeout(8000),
  })

  if (res.status === 409) {
    throw new Error('DUPLICATE_RMA')
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`RMA create failed (${res.status}): ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    doc?: { id?: number; rmaNumber?: string; status?: string }
  }
  const doc = data.doc
  if (!doc?.rmaNumber) {
    throw new Error('Invalid RMA response')
  }

  return {
    id: doc.id ?? 0,
    rmaNumber: doc.rmaNumber,
    status: doc.status ?? 'requested',
  }
}

export async function listPayloadRmaIncidents(
  customerId: string,
  options: { status?: RmaListFilter; page?: number; pageSize?: number },
): Promise<RmaListResult> {
  const base = payloadBaseUrl()
  const key = apiKey()
  if (!base || !key) {
    return { incidents: [], total: 0, page: 1, pageSize: 25 }
  }

  const params = new URLSearchParams({
    customerRef: customerId,
    status: options.status ?? 'all',
    page: String(options.page ?? 1),
    pageSize: String(options.pageSize ?? 25),
  })

  const res = await fetch(`${base.replace(/\/$/, '')}/api/rma-incidents/storefront-list?${params}`, {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(5000),
  })

  if (!res.ok) {
    return { incidents: [], total: 0, page: 1, pageSize: 25 }
  }

  const data = (await res.json()) as {
    docs?: RmaIncidentRow[]
    total?: number
    page?: number
    pageSize?: number
  }

  return {
    incidents: data.docs ?? [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    pageSize: data.pageSize ?? 25,
  }
}
