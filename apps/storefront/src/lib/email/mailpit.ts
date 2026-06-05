import 'server-only'

import { createTransport } from 'nodemailer'

export function isMailpitEnabled(): boolean {
  const flag = process.env.USE_MAILPIT?.trim().toLowerCase()
  if (flag === 'true') return true
  if (flag === 'false') return false
  if (process.env.SMTP_USE_MAILPIT === 'true') return true
  if (process.env.SMTP_USE_RESEND === 'true') return false
  return process.env.NODE_ENV !== 'production'
}

export function getMailpitWebUrl(): string {
  return process.env.MAILPIT_WEB_URL?.trim() || 'http://localhost:8025'
}

function getTransportOptions() {
  const host = process.env.MAILPIT_SMTP_HOST?.trim() || 'localhost'
  const port = Number(process.env.MAILPIT_SMTP_PORT || 1025)
  return { host, port, secure: false, ignoreTLS: true } as const
}

export async function sendMailpitEmail(input: {
  to: string
  subject: string
  html: string
  fromName?: string
  fromEmail?: string
}): Promise<void> {
  const fromName = input.fromName ?? process.env.RESEND_FROM_NAME?.trim() ?? 'Jeyjo'
  const fromEmail = input.fromEmail ?? process.env.RESEND_FROM_EMAIL?.trim() ?? 'noreply@jeyjo.local'
  const transport = createTransport(getTransportOptions())

  await transport.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
  })
}
