import type { Payload } from 'payload'

export async function sendMfaCodeEmail(
  payload: Payload,
  email: string,
  code: string,
  isEnrollment: boolean,
): Promise<void> {
  const subject = isEnrollment
    ? 'Código de activación MFA — Jeyjo Backoffice'
    : 'Código de verificación — Jeyjo Backoffice'

  const fromName = process.env.RESEND_FROM_NAME || 'Jeyjo'
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@tudominio.com'

  await payload.sendEmail({
    from: `${fromName} <${fromEmail}>`,
    to: email,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 480px;">
        <h1 style="font-size: 1.25rem;">Jeyjo Backoffice</h1>
        <p>${isEnrollment ? 'Activa la autenticación en dos pasos con este código:' : 'Introduce este código para continuar:'}</p>
        <p style="font-size: 2rem; font-weight: bold; letter-spacing: 0.25rem; margin: 1.5rem 0;">${code}</p>
        <p style="color: #666;">Válido durante 10 minutos. Si no has solicitado este código, ignora este mensaje.</p>
      </div>
    `,
  })
}
