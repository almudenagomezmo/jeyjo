import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@jeyjo/database-types'

import { getMailpitWebUrl, sendMailpitEmail } from '@/lib/email/mailpit'

type RegisterViaMailpitResult =
  | { ok: true; userId: string }
  | { ok: false; message: string; code: 'mailpit_unreachable' | 'auth_error' }

export async function registerAuthUserViaMailpit(
  admin: SupabaseClient<Database>,
  input: { email: string; password: string; redirectTo: string },
): Promise<RegisterViaMailpitResult> {
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'signup',
    email: input.email,
    password: input.password,
    options: { redirectTo: input.redirectTo },
  })

  if (error || !data.user) {
    return { ok: false, message: error?.message ?? 'No se pudo crear el usuario', code: 'auth_error' }
  }

  const actionLink = data.properties?.action_link
  if (!actionLink) {
    await admin.auth.admin.deleteUser(data.user.id)
    return { ok: false, message: 'No se pudo generar el enlace de confirmación', code: 'auth_error' }
  }

  const mailpitUrl = getMailpitWebUrl()

  try {
    await sendMailpitEmail({
      to: input.email,
      subject: 'Confirma tu cuenta — Jeyjo',
      html: `
        <div style="font-family: sans-serif; max-width: 480px;">
          <h1 style="font-size: 1.25rem;">Jeyjo</h1>
          <p>Confirma tu email para activar la cuenta:</p>
          <p><a href="${actionLink}">Confirmar cuenta</a></p>
          <p style="color: #666; font-size: 0.875rem;">Desarrollo local: este correo se envió a Mailpit (${mailpitUrl}), no a tu bandeja real.</p>
        </div>
      `,
    })
  } catch {
    await admin.auth.admin.deleteUser(data.user.id)
    return {
      ok: false,
      message: `Mailpit no responde en ${process.env.MAILPIT_SMTP_HOST ?? 'localhost'}:${process.env.MAILPIT_SMTP_PORT ?? '1025'}. Ejecuta: pnpm mailpit:up`,
      code: 'mailpit_unreachable',
    }
  }

  return { ok: true, userId: data.user.id }
}
