import type { ErpDocumentType } from '@jeyjo/erp-ports'

type CmsCustomerDocument = {
  id: number | string
  customerId: string
  documentType: string
  documentNumber: string
  issuedAt: string
  netAmount?: number | null
  grossAmount?: number | null
  dueDate?: string | null
  outstandingAmount?: number | null
  status?: string | null
  storagePath?: string | null
  fiscalYear?: number | null
  validUntil?: string | null
}

function cmsBaseUrl(): string | null {
  return (
    process.env.CMS_INTERNAL_URL ??
    process.env.CMS_URL ??
    process.env.NEXT_PUBLIC_PAYLOAD_URL ??
    null
  )
}

function cmsApiKey(): string | null {
  return process.env.STOREFRONT_PAYLOAD_API_KEY ?? null
}

export async function fetchCmsCustomerDocuments(
  customerId: string,
  documentType?: ErpDocumentType | 'due_payment',
): Promise<CmsCustomerDocument[]> {
  const base = cmsBaseUrl()
  const key = cmsApiKey()
  if (!base || !key) return []

  const params = new URLSearchParams({ customerId })
  if (documentType) params.set('documentType', documentType)

  const res = await fetch(`${base.replace(/\/$/, '')}/api/customer-documents/list?${params}`, {
    headers: {
      Authorization: `Bearer ${key}`,
    },
    cache: 'no-store',
  })
  if (!res.ok) return []
  const json = (await res.json()) as { docs?: CmsCustomerDocument[] }
  return json.docs ?? []
}

export async function fetchCmsCustomerDocumentById(
  id: string,
): Promise<CmsCustomerDocument | null> {
  const base = cmsBaseUrl()
  const key = cmsApiKey()
  if (!base || !key) return null

  const res = await fetch(`${base.replace(/\/$/, '')}/api/customer-documents/${id}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  return (await res.json()) as CmsCustomerDocument
}

export type { CmsCustomerDocument }
