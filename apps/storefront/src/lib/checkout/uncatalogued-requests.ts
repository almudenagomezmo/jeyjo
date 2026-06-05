const STORAGE_KEY = 'jeyjo-uncatalogued-requests'

export type UncataloguedRequest = {
  id: string
  reference: string
  description: string
  qty: number
  createdAt: string
}

export function formatUncataloguedNotesBlock(requests: UncataloguedRequest[]): string {
  if (requests.length === 0) return ''
  const lines = requests.map(
    (r) => `- ${r.reference || 'Sin referencia'} x${r.qty}: ${r.description.trim()}`,
  )
  return ['[Solicitudes no catalogadas]', ...lines].join('\n')
}

export function mergeCustomerNotesWithUncatalogued(
  customerNotes: string,
  requests: UncataloguedRequest[],
): string {
  const block = formatUncataloguedNotesBlock(requests)
  if (!block) return customerNotes.trim()
  const base = customerNotes.trim()
  if (!base) return block
  if (base.includes('[Solicitudes no catalogadas]')) return base
  return `${base}\n\n${block}`
}

/** Browser-only helpers (no-op on server). */
export function loadUncataloguedRequests(): UncataloguedRequest[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (r): r is UncataloguedRequest =>
        r != null &&
        typeof r === 'object' &&
        typeof (r as UncataloguedRequest).description === 'string' &&
        typeof (r as UncataloguedRequest).qty === 'number',
    )
  } catch {
    return []
  }
}

export function saveUncataloguedRequest(
  entry: Omit<UncataloguedRequest, 'id' | 'createdAt'>,
): UncataloguedRequest[] {
  if (typeof window === 'undefined') return []
  const next: UncataloguedRequest = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  const list = [...loadUncataloguedRequests(), next]
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  return list
}

export function clearUncataloguedRequests(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(STORAGE_KEY)
}
