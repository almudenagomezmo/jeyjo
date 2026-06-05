import type { NewsletterEspPort } from './types'

type BrevoLogger = { error: (msg: unknown) => void }

export function createBrevoEspAdapter(args: {
  apiKey: string
  listId: number
  logger?: BrevoLogger
}): NewsletterEspPort {
  const baseUrl = 'https://api.brevo.com/v3'

  async function brevoFetch(path: string, init: RequestInit): Promise<Response> {
    return fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        'api-key': args.apiKey,
        'content-type': 'application/json',
        ...(init.headers ?? {}),
      },
    })
  }

  return {
    async upsertContact(input) {
      const res = await brevoFetch('/contacts', {
        method: 'POST',
        body: JSON.stringify({
          email: input.email,
          attributes: {
            SOURCE: input.attributes.source,
            SEGMENT: input.attributes.segment,
          },
          listIds: [args.listId],
          updateEnabled: true,
        }),
      })

      if (res.ok) {
        const data = (await res.json()) as { id?: number }
        return { contactId: data.id != null ? String(data.id) : null }
      }

      const text = await res.text()
      if (res.status === 400 && /already exist/i.test(text)) {
        const updateRes = await brevoFetch(`/contacts/${encodeURIComponent(input.email)}`, {
          method: 'PUT',
          body: JSON.stringify({
            attributes: {
              SOURCE: input.attributes.source,
              SEGMENT: input.attributes.segment,
            },
            listIds: [args.listId],
          }),
        })
        if (!updateRes.ok) {
          args.logger?.error({ msg: 'Brevo contact update failed', status: updateRes.status, text: await updateRes.text() })
          throw new Error('Brevo contact update failed')
        }
        return { contactId: null }
      }

      args.logger?.error({ msg: 'Brevo contact create failed', status: res.status, text })
      throw new Error('Brevo contact create failed')
    },

    async removeContact(input) {
      const res = await brevoFetch(`/contacts/${encodeURIComponent(input.email)}`, {
        method: 'DELETE',
      })
      if (res.ok || res.status === 404) return
      const text = await res.text()
      args.logger?.error({ msg: 'Brevo contact delete failed', status: res.status, text })
      throw new Error('Brevo contact delete failed')
    },
  }
}
