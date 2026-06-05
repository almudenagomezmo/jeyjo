import type { Payload } from 'payload'

import type { NotificationPayload, NotificationType } from '../types'

type SendProactiveEmailArgs = {
  to: string
  type: NotificationType
  title: string
  body?: string
  payload?: NotificationPayload
}

function formatAmount(amount: number | undefined, currency = 'EUR'): string {
  if (amount == null || Number.isNaN(amount)) return '—'
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount)
}

function buildHtml(args: SendProactiveEmailArgs): { subject: string; html: string } {
  const p = args.payload ?? {}
  const link = p.href ? `<p><a href="${escapeAttr(p.href)}">Ver en el portal</a></p>` : ''

  switch (args.type) {
    case 'invoice_new':
      return {
        subject: 'Nueva factura disponible en tu portal Jeyjo',
        html: `
          <h1>Nueva factura disponible</h1>
          <p>${escapeHtml(args.body ?? 'Hay una nueva factura en tu área de cliente.')}</p>
          <p>Importe: <strong>${formatAmount(p.amount, p.currency as string | undefined)}</strong></p>
          ${link}
        `,
      }
    case 'order_status':
      return {
        subject: `Tu pedido ${escapeHtml(String(p.orderNumber ?? ''))} — ${escapeHtml(String(p.statusLabel ?? ''))}`,
        html: `
          <h1>Actualización de pedido</h1>
          <p>Tu pedido <strong>${escapeHtml(String(p.orderNumber ?? ''))}</strong> ha pasado a estado <strong>${escapeHtml(String(p.statusLabel ?? ''))}</strong>.</p>
          ${link}
        `,
      }
    case 'quote_status':
      return {
        subject: `Actualización de tu presupuesto ${escapeHtml(String(p.quoteNumber ?? ''))}`,
        html: `
          <h1>Presupuesto actualizado</h1>
          <p>El presupuesto <strong>${escapeHtml(String(p.quoteNumber ?? ''))}</strong> está ahora en estado <strong>${escapeHtml(String(p.statusLabel ?? ''))}</strong>.</p>
          ${link}
        `,
      }
    case 'quote_expiring':
      return {
        subject: `Tu presupuesto ${escapeHtml(String(p.quoteNumber ?? ''))} caduca en 7 días`,
        html: `
          <h1>Presupuesto próximo a caducar</h1>
          <p>El presupuesto <strong>${escapeHtml(String(p.quoteNumber ?? ''))}</strong> caduca en 7 días.</p>
          ${link}
        `,
      }
    case 'stock_available': {
      const sku = String(p.sku ?? '')
      const title = String(p.productTitle ?? sku)
      const stockLabel = String(p.stockLabel ?? 'Disponible')
      return {
        subject: `Ya hay stock de ${escapeHtml(sku)} en Jeyjo`,
        html: `
          <h1>Stock disponible</h1>
          <p>El producto <strong>${escapeHtml(title)}</strong> (${escapeHtml(sku)}) ya tiene stock: <strong>${escapeHtml(stockLabel)}</strong>.</p>
          ${link}
        `,
      }
    }
  }
}

export async function sendProactiveEmail(
  payload: Payload,
  args: SendProactiveEmailArgs,
): Promise<boolean> {
  const { subject, html } = buildHtml(args)
  try {
    await payload.sendEmail({ to: args.to, subject, html })
    return true
  } catch (err) {
    payload.logger.error({ msg: 'Failed to send proactive notification email', err, type: args.type })
    if (isHardBounceError(err)) {
      throw err
    }
    return false
  }
}

export function isHardBounceError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /bounce|hard.?bounce|invalid.*recipient|permanent/i.test(msg)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, '&#39;')
}
