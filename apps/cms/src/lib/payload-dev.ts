import type { CollectionConfig, GlobalConfig, Payload, Plugin } from 'payload'

/**
 * Payload admin save runs form-state + document lock find/delete + update in parallel.
 * With Supabase + Next HMR, that exhausts pg pools. Locks are optional in dev.
 * Set PAYLOAD_DOCUMENT_LOCKS=true to keep collaborative editing locks locally.
 */
export const devDisableDocumentLocks =
  process.env.NODE_ENV === 'development' &&
  process.env.PAYLOAD_DOCUMENT_LOCKS !== 'true'

export function withoutDocumentLocks<T extends CollectionConfig | GlobalConfig>(config: T): T {
  if (!devDisableDocumentLocks) return config
  return { ...config, lockDocuments: false }
}

/** Patches collections registered by plugins (e.g. ecommerce) after init. */
export function disableDocumentLocksInDev(payload: Payload): void {
  if (!devDisableDocumentLocks) return

  for (const slug of Object.keys(payload.collections)) {
    payload.collections[slug].config.lockDocuments = false
  }

  for (const global of payload.config.globals) {
    global.lockDocuments = false
  }
}

export const devDisableDocumentLocksPlugin: Plugin = {
  name: 'jeyjo-dev-disable-document-locks',
  onInit: async (payload) => {
    disableDocumentLocksInDev(payload)
  },
}
