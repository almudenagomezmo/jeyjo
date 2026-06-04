import type { Payload } from 'payload'

import type { QuoteLineSnapshot } from '@/lib/quotes/map-quote-input'

type SendQuoteRequestEmailArgs = {
  to: string
  quoteNumber: string
  lineSnapshots: QuoteLineSnapshot[]
  amount: number | null
}

export async function sendQuoteRequestEmail(
  payload: Payload,
  args: SendQuoteRequestEmailArgs,
): Promise<boolean> {
  const linesHtml = args.lineSnapshots
    .map(
      (l) =>
        `<tr><td>${escapeHtml(l.name)}</td><td>${l.qty}</td><td>${l.lineTotal.toFixed(2)} €</td></tr>`,
    )
    .join('')

  const total = args.amount != null ? `${args.amount.toFixed(2)} €` : '—'

  const html = `
    <h1>Solicitud de presupuesto recibida</h1>
    <p>Hemos recibido tu solicitud de presupuesto con número <strong>${escapeHtml(args.quoteNumber)}</strong>.</p>
    <p>Importe estimado: <strong>${total}</strong></p>
    <table border="1" cellpadding="8" cellspacing="0">
      <thead><tr><th>Producto</th><th>Cantidad</th><th>Total línea</th></tr></thead>
      <tbody>${linesHtml || '<tr><td colspan="3">Sin líneas</td></tr>'}</tbody>
    </table>
    <p>Nuestro equipo revisará tu solicitud y te contactará con el presupuesto formal.</p>
    <p>Gracias por confiar en Jeyjo.</p>
  `

  try {
    await payload.sendEmail({
      to: args.to,
      subject: `Presupuesto ${args.quoteNumber} — solicitud recibida`,
      html,
    })
    return true
  } catch (err) {
    payload.logger.error({ msg: 'Failed to send quote request email', err })
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
