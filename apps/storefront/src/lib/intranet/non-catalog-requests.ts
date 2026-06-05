export const NON_CATALOG_STORAGE_KEY = 'jeyjo-non-catalog-requests'

export type NonCatalogRequest = {
  reference: string
  note: string
  createdAt: string
}

export function formatNonCatalogBlock(requests: NonCatalogRequest[]): string {
  if (requests.length === 0) return ''
  const lines = requests.map((r) => {
    const note = r.note.trim()
    return note ? `- ${r.reference}: ${note}` : `- ${r.reference}`
  })
  return `Referencias no catalogadas:\n${lines.join('\n')}`
}

export function mergeObservationsWithNonCatalog(
  userNotes: string,
  requests: NonCatalogRequest[],
  maxLength = 500,
): { text: string; truncated: boolean } {
  const block = formatNonCatalogBlock(requests)
  if (!block) return { text: userNotes, truncated: false }

  const trimmed = userNotes.trim()
  const combined = trimmed ? `${trimmed}\n\n${block}` : block
  if (combined.length <= maxLength) {
    return { text: combined, truncated: false }
  }
  return { text: combined.slice(0, maxLength), truncated: true }
}

export function readNonCatalogRequests(): NonCatalogRequest[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(NON_CATALOG_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as NonCatalogRequest[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeNonCatalogRequests(requests: NonCatalogRequest[]): void {
  if (typeof window === 'undefined') return
  if (requests.length === 0) {
    sessionStorage.removeItem(NON_CATALOG_STORAGE_KEY)
    return
  }
  sessionStorage.setItem(NON_CATALOG_STORAGE_KEY, JSON.stringify(requests))
}

export function addNonCatalogRequest(reference: string, note: string): NonCatalogRequest[] {
  const next: NonCatalogRequest = {
    reference: reference.trim(),
    note: note.trim(),
    createdAt: new Date().toISOString(),
  }
  const list = [...readNonCatalogRequests(), next]
  writeNonCatalogRequests(list)
  return list
}

export function removeNonCatalogRequest(index: number): NonCatalogRequest[] {
  const list = readNonCatalogRequests().filter((_, i) => i !== index)
  writeNonCatalogRequests(list)
  return list
}

export function clearNonCatalogRequests(): void {
  writeNonCatalogRequests([])
}
