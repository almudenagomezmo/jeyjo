export function isMailpitEnabled(): boolean {
  const flag = process.env.USE_MAILPIT?.trim().toLowerCase()
  if (flag === 'true') return true
  if (flag === 'false') return false
  if (process.env.SMTP_USE_MAILPIT === 'true') return true
  if (process.env.SMTP_USE_RESEND === 'true') return false
  return process.env.NODE_ENV !== 'production'
}

export function getMailpitTransportOptions() {
  const host = process.env.MAILPIT_SMTP_HOST?.trim() || 'localhost'
  const port = Number(process.env.MAILPIT_SMTP_PORT || 1025)
  return { host, port, secure: false, ignoreTLS: true }
}

export function getResendTransportOptions() {
  const port = Number(process.env.RESEND_SMTP_PORT || 587)
  return {
    host: process.env.RESEND_SMTP_HOST || 'smtp.resend.com',
    port,
    auth: { user: 'resend', pass: process.env.RESEND_API_KEY },
    secure: port === 465,
  }
}

/** USE_MAILPIT=true → Mailpit; false + RESEND_API_KEY → Resend; si no, jsonTransport. */
export function getEmailTransportOptions() {
  if (isMailpitEnabled()) {
    return getMailpitTransportOptions()
  }

  if (process.env.RESEND_API_KEY?.trim()) {
    return getResendTransportOptions()
  }

  return { jsonTransport: true }
}
