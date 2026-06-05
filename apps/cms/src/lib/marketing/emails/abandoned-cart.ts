import type { Payload } from 'payload'

const FIRST_SUBJECT = 'Tienes artículos esperándote en Jeyjo'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendAbandonedCartFirstEmail(
  payload: Payload,
  args: { to: string; recoverUrl: string },
): Promise<boolean> {
  const html = `
    <h1>Tu carrito te espera</h1>
    <p>Dejaste artículos en tu carrito en Jeyjo. Puedes recuperarlos con un solo clic:</p>
    <p><a href="${escapeHtml(args.recoverUrl)}">Volver a mi carrito</a></p>
    <p>Gracias por confiar en Jeyjo.</p>
  `

  try {
    await payload.sendEmail({
      to: args.to,
      subject: FIRST_SUBJECT,
      html,
    })
    return true
  } catch (err) {
    payload.logger.error({ msg: 'Failed to send first abandoned cart email', err })
    return false
  }
}

export async function sendAbandonedCartSecondEmail(
  payload: Payload,
  args: {
    to: string
    recoverUrl: string
    couponCode: string | null
    discountPercent: number
  },
): Promise<boolean> {
  const couponBlock = args.couponCode
    ? `<p>Usa el código <strong>${escapeHtml(args.couponCode)}</strong> para un ${args.discountPercent}% de descuento.</p>`
    : `<p>Aprovecha un ${args.discountPercent}% de descuento en tu pedido.</p>`

  const html = `
    <h1>¿Aún te interesa?</h1>
    <p>Tu carrito sigue disponible. Te ofrecemos un descuento especial para completar tu compra.</p>
    ${couponBlock}
    <p><a href="${escapeHtml(args.recoverUrl)}">Recuperar mi carrito</a></p>
    <p>Gracias por confiar en Jeyjo.</p>
  `

  try {
    await payload.sendEmail({
      to: args.to,
      subject: 'Un descuento especial para tu carrito en Jeyjo',
      html,
    })
    return true
  } catch (err) {
    payload.logger.error({ msg: 'Failed to send second abandoned cart email', err })
    return false
  }
}
