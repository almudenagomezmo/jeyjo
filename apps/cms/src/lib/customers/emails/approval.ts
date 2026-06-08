import type { Payload } from 'payload'

import {
  approvalEmailSegmentCopy,
  customerGroupLabel,
  type CustomerGroup,
} from '@/lib/customers/group-labels'

export type ApprovalEmailInput = {
  to: string
  commercialName: string
  customerGroup: CustomerGroup
  taxId?: string | null
  isCompany?: boolean
}

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

export function buildCustomerApprovalEmail(input: ApprovalEmailInput): {
  subject: string
  html: string
  portalPath: '/cuenta'
} {
  const portalPath = '/cuenta'
  const portalUrl = `${storefrontBaseUrl()}${portalPath}`
  const groupLabel = customerGroupLabel(input.customerGroup)
  const segmentCopy = approvalEmailSegmentCopy(input.customerGroup)
  const taxLine =
    input.taxId?.trim() ?
      `<p>CIF/NIF: <strong>${escapeHtml(input.taxId.trim())}</strong></p>`
    : ''

  const subject = 'Tu cuenta Jeyjo ha sido validada'

  const html = `
    <h1>Cuenta validada</h1>
    <p>Hola ${escapeHtml(input.commercialName)},</p>
    <p>${escapeHtml(segmentCopy)}</p>
    <p>Grupo asignado: <strong>${escapeHtml(groupLabel)}</strong></p>
    ${taxLine}
    <p><a href="${escapeHtml(portalUrl)}">Acceder a tu área de cliente</a></p>
    <p style="font-size:12px;color:#666;">Este correo confirma la aprobación por el equipo de Jeyjo. La verificación de email se realizó al registrarte.</p>
  `

  return { subject, html, portalPath }
}

export async function sendCustomerApprovalEmail(
  payload: Payload,
  input: ApprovalEmailInput,
): Promise<boolean> {
  const { subject, html } = buildCustomerApprovalEmail(input)
  try {
    await payload.sendEmail({ to: input.to, subject, html })
    return true
  } catch (err) {
    payload.logger.error({
      msg: 'Failed to send customer approval email',
      err,
      email: input.to,
      customerGroup: input.customerGroup,
    })
    return false
  }
}
