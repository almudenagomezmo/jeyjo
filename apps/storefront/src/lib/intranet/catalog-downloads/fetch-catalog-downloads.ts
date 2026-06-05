import { isCatalogDownloadActive, matchesCustomerGroup } from './validity'
import { mapCatalogDownloadDoc } from './map-document'
import type { CatalogDownloadDto } from './types'

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

export async function fetchB2bCatalogDownloads(options: {
  customerGroup: number
  today?: string
}): Promise<CatalogDownloadDto[]> {
  const base = payloadBaseUrl()
  const key = apiKey()
  if (!base || !key) return []

  const params = new URLSearchParams({
    depth: '1',
    limit: '100',
    'where[published][equals]': 'true',
  })

  const res = await fetch(`${base.replace(/\/$/, '')}/api/b2b-catalog-downloads?${params}`, {
    headers: { Authorization: `Bearer ${key}` },
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) return []

  const data = (await res.json()) as { docs?: Array<Record<string, unknown>> }
  const docs = data.docs ?? []

  return docs
    .filter((doc) =>
      isCatalogDownloadActive(
        doc.validFrom as string | undefined,
        doc.validUntil as string | undefined,
        options.today,
      ),
    )
    .filter((doc) =>
      matchesCustomerGroup(doc.customerGroups as string[] | null | undefined, options.customerGroup),
    )
    .map((doc) => mapCatalogDownloadDoc(doc as Parameters<typeof mapCatalogDownloadDoc>[0]))
    .filter((row): row is CatalogDownloadDto => row != null)
    .sort((a, b) => b.validFrom.localeCompare(a.validFrom))
}
