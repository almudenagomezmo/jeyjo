import type { EspContactAttributes } from '../types'

export type NewsletterEspPort = {
  upsertContact(input: { email: string; attributes: EspContactAttributes }): Promise<{ contactId: string | null }>
  removeContact(input: { email: string }): Promise<void>
}
