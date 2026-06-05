import type { Payload } from 'payload'

import type { NewsletterSubscriberRow } from './types'

function storefrontBaseUrl(): string {
  return (
    process.env.STOREFRONT_URL ??
    process.env.NEXT_PUBLIC_STOREFRONT_URL ??
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendNewsletterConfirmationEmail(
  payload: Payload,
  subscriber: NewsletterSubscriberRow,
): Promise<boolean> {
  const confirmUrl = `${storefrontBaseUrl()}/newsletter/confirm?token=${encodeURIComponent(subscriber.confirm_token)}`
  const unsubscribeUrl = `${storefrontBaseUrl()}/newsletter/unsubscribe?token=${encodeURIComponent(subscriber.unsubscribe_token)}`

  const html = `
    <h1>Confirma tu suscripción</h1>
    <p>Gracias por interesarte en la newsletter de Jeyjo.</p>
    <p><a href="${confirmUrl}">Confirmar suscripción</a></p>
    <p style="font-size:12px;color:#666;">Si no solicitaste este correo, ignóralo.</p>
    <p style="font-size:12px;color:#666;"><a href="${unsubscribeUrl}">Darse de baja</a></p>
  `

  try {
    await payload.sendEmail({
      to: subscriber.email,
      subject: 'Confirma tu suscripción a la newsletter de Jeyjo',
      html,
    })
    return true
  } catch (err) {
    payload.logger.error({ msg: 'Failed to send newsletter confirmation', err, email: subscriber.email })
    return false
  }
}

export function buildNewsletterConfirmationPreview(subscriber: Pick<NewsletterSubscriberRow, 'confirm_token' | 'unsubscribe_token'>) {
  const confirmUrl = `${storefrontBaseUrl()}/newsletter/confirm?token=${encodeURIComponent(subscriber.confirm_token)}`
  return {
    subject: 'Confirma tu suscripción a la newsletter de Jeyjo',
    confirmUrl: escapeHtml(confirmUrl),
  }
}
