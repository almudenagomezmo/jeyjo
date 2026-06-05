import type { NewsletterEspPort } from './types'

export function createNoopEspAdapter(logger?: { info: (msg: unknown) => void }): NewsletterEspPort {
  return {
    async upsertContact(input) {
      logger?.info({ msg: '[newsletter-esp] noop upsert', email: input.email, attributes: input.attributes })
      return { contactId: null }
    },
    async removeContact(input) {
      logger?.info({ msg: '[newsletter-esp] noop remove', email: input.email })
    },
  }
}
