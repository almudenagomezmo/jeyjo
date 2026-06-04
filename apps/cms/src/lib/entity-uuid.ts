import { createHash } from 'crypto'

/** Deterministic UUID for Payload integer IDs stored in Supabase uuid columns. */
export function payloadIdToUuid(namespace: string, id: string | number): string {
  const hash = createHash('sha256').update(`${namespace}:${id}`).digest('hex')
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`
}
