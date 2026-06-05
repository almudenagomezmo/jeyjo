import type { Payload } from 'payload'

import { rmaReasonLabel, type RmaReason } from '@/lib/rma/reason-labels'

type SendRmaRequestEmailArgs = {
  to: string
  rmaNumber: string
  articleSku: string
  deliveryNoteNumber: string
  reason: RmaReason
  observations?: string | null
}

export async function sendRmaRequestEmail(
  payload: Payload,
  args: SendRmaRequestEmailArgs,
): Promise<boolean> {
  const reasonLabel = rmaReasonLabel(args.reason)
  const obs = args.observations?.trim()
  const obsBlock = obs
    ? `<p><strong>Observaciones:</strong> ${escapeHtml(obs)}</p>`
    : ''

  const html = `
    <h1>Solicitud de RMA recibida</h1>
    <p>Hemos registrado tu solicitud de devolución con número <strong>${escapeHtml(args.rmaNumber)}</strong>.</p>
    <ul>
      <li><strong>Referencia:</strong> ${escapeHtml(args.articleSku)}</li>
      <li><strong>Albarán:</strong> ${escapeHtml(args.deliveryNoteNumber)}</li>
      <li><strong>Motivo:</strong> ${escapeHtml(reasonLabel)}</li>
    </ul>
    ${obsBlock}
    <p><strong>Importante:</strong> ninguna devolución se acepta sin autorización previa de Jeyjo. Te informaremos cuando revisemos tu solicitud.</p>
    <p>Gracias por confiar en Jeyjo.</p>
  `

  try {
    await payload.sendEmail({
      to: args.to,
      subject: `RMA ${args.rmaNumber} — solicitud recibida`,
      html,
    })
    return true
  } catch (err) {
    payload.logger.error({ msg: 'Failed to send RMA request email', err })
    return false
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
