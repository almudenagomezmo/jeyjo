import { APIError, type Endpoint } from 'payload'

import { hasStaffRole, isStaff } from '@/access/staffRoles'
import {
  clearEmailMfaCode,
  storeEmailMfaCode,
  verifyEmailMfaCode,
} from '@/lib/mfa-email-codes'
import { getMfaMode, isEmailMfaMode } from '@/lib/mfa-mode'
import { clearMfaCookieHeader, mfaCookieHeader } from '@/lib/mfa-session'
import { sendMfaCodeEmail } from '@/lib/send-mfa-email'
import { extractSourceIp, writeSecurityAudit } from '@/lib/supabase-server'
import { generateTotpSecret, getTotpUri, verifyTotpCode } from '@/lib/totp'

function requireStaffUser(req: Parameters<NonNullable<Endpoint['handler']>>[0]) {
  if (!req.user || !isStaff(req.user)) {
    throw new APIError('Forbidden', 403)
  }
  return req.user
}

async function logMfaSecurityAudit(
  req: Parameters<NonNullable<Endpoint['handler']>>[0],
  input: Parameters<typeof writeSecurityAudit>[0],
): Promise<void> {
  try {
    await writeSecurityAudit(input)
  } catch (err) {
    req.payload.logger.error({ err }, 'Failed to write MFA security audit')
  }
}

async function sendEmailMfaCode(
  req: Parameters<NonNullable<Endpoint['handler']>>[0],
  isEnrollment: boolean,
) {
  const user = requireStaffUser(req)
  const email = user.email?.trim()
  if (!email) throw new APIError('User email required for MFA', 400)

  const code = storeEmailMfaCode(user.id)

  try {
    await sendMfaCodeEmail(req.payload, email, code, isEnrollment)
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      req.payload.logger.warn({
        msg: '[dev] MFA email delivery failed — use the code from this log entry',
        err,
        userId: user.id,
        email,
        code,
      })
      return Response.json({ mode: 'email' as const, sent: true, email })
    }

    clearEmailMfaCode(user.id)
    req.payload.logger.error({ msg: 'Failed to send MFA email', err, userId: user.id })
    throw new APIError('No se pudo enviar el código por email. Revisa la configuración SMTP.', 500)
  }

  if (process.env.NODE_ENV !== 'production') {
    req.payload.logger.info({ msg: '[dev] MFA code sent', userId: user.id, email, code })
  }

  return Response.json({ mode: 'email' as const, sent: true, email })
}

export const mfaSetupEndpoint: Endpoint = {
  path: '/mfa/setup',
  method: 'post',
  handler: async (req) => {
    const user = requireStaffUser(req)

    if (isEmailMfaMode()) {
      const fullUser = await req.payload.findByID({
        collection: 'users',
        id: user.id,
        depth: 0,
        overrideAccess: true,
      })
      return sendEmailMfaCode(req, !fullUser.twoFactorEnabled)
    }

    const secret = generateTotpSecret()

    await req.payload.update({
      collection: 'users',
      id: user.id,
      data: { totpSecret: secret, twoFactorEnabled: false },
      overrideAccess: true,
    })

    const uri = getTotpUri(secret, user.email || String(user.id))
    return Response.json({ mode: 'totp' as const, secret, uri })
  },
}

export const mfaVerifyEnrollmentEndpoint: Endpoint = {
  path: '/mfa/verify-enrollment',
  method: 'post',
  handler: async (req) => {
    const user = requireStaffUser(req)
    const body = (await req.json!()) as { code?: string }
    const code = body.code?.trim()
    if (!code) throw new APIError('Code required', 400)

    if (isEmailMfaMode()) {
      if (!verifyEmailMfaCode(user.id, code, { consume: false })) {
        throw new APIError('Invalid email code', 400)
      }

      await req.payload.update({
        collection: 'users',
        id: user.id,
        data: { twoFactorEnabled: true, totpSecret: null },
        overrideAccess: true,
      })

      clearEmailMfaCode(user.id)

      await logMfaSecurityAudit(req, {
        action: 'MFA_ENROLLED',
        actorId: user.id,
        actorName: user.email ?? null,
        entityId: user.id,
        metadata: { mode: 'email' },
        sourceIp: extractSourceIp(req.headers),
      })

      return new Response(JSON.stringify({ success: true, mode: 'email' }), {
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': mfaCookieHeader(user.id),
        },
      })
    }

    const fullUser = await req.payload.findByID({
      collection: 'users',
      id: user.id,
      depth: 0,
      overrideAccess: true,
    })

    const secret = fullUser.totpSecret
    if (!secret || !verifyTotpCode(secret, code, fullUser.email || 'staff')) {
      throw new APIError('Invalid TOTP code', 400)
    }

    await req.payload.update({
      collection: 'users',
      id: user.id,
      data: { twoFactorEnabled: true },
      overrideAccess: true,
    })

    await logMfaSecurityAudit(req, {
      action: 'MFA_ENROLLED',
      actorId: user.id,
      actorName: user.email ?? null,
      entityId: user.id,
      sourceIp: extractSourceIp(req.headers),
    })

    return new Response(JSON.stringify({ success: true, mode: 'totp' }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': mfaCookieHeader(user.id),
      },
    })
  },
}

export const mfaVerifyEndpoint: Endpoint = {
  path: '/mfa/verify',
  method: 'post',
  handler: async (req) => {
    const user = requireStaffUser(req)
    const body = (await req.json!()) as { code?: string }
    const code = body.code?.trim()
    if (!code) throw new APIError('Code required', 400)

    const fullUser = await req.payload.findByID({
      collection: 'users',
      id: user.id,
      depth: 0,
      overrideAccess: true,
    })

    if (!fullUser.twoFactorEnabled) {
      throw new APIError('MFA not enrolled', 400)
    }

    if (isEmailMfaMode()) {
      if (!verifyEmailMfaCode(user.id, code, { consume: false })) {
        throw new APIError('Invalid email code', 401)
      }

      clearEmailMfaCode(user.id)

      return new Response(JSON.stringify({ success: true, mode: 'email' }), {
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': mfaCookieHeader(user.id),
        },
      })
    }

    if (!fullUser.totpSecret) {
      throw new APIError('MFA not enrolled', 400)
    }

    if (!verifyTotpCode(fullUser.totpSecret, code, fullUser.email || 'staff')) {
      throw new APIError('Invalid TOTP code', 401)
    }

    return new Response(JSON.stringify({ success: true, mode: 'totp' }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': mfaCookieHeader(user.id),
      },
    })
  },
}

export const mfaResetEndpoint: Endpoint = {
  path: '/mfa/reset/:userId',
  method: 'post',
  handler: async (req) => {
    const actor = requireStaffUser(req)
    if (!hasStaffRole(actor, ['superadmin'])) {
      throw new APIError('Forbidden', 403)
    }

    const targetId = String(req.routeParams?.userId ?? '')
    if (!targetId) throw new APIError('userId required', 400)

    clearEmailMfaCode(targetId)

    await req.payload.update({
      collection: 'users',
      id: targetId,
      data: { totpSecret: null, twoFactorEnabled: false },
      overrideAccess: true,
    })

    await logMfaSecurityAudit(req, {
      action: 'MFA_RESET',
      actorId: actor.id,
      actorName: actor.email ?? null,
      entityId: targetId,
      metadata: { targetUserId: targetId },
      sourceIp: extractSourceIp(req.headers),
    })

    return Response.json({ success: true })
  },
}

export const mfaLogoutEndpoint: Endpoint = {
  path: '/mfa/logout',
  method: 'post',
  handler: async () => {
    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': clearMfaCookieHeader(),
      },
    })
  },
}

export const mfaStatusEndpoint: Endpoint = {
  path: '/mfa/status',
  method: 'get',
  handler: async (req) => {
    requireStaffUser(req)
    const { hasValidMfaSession } = await import('@/lib/mfa-session')
    return Response.json({ verified: hasValidMfaSession(req), mode: getMfaMode() })
  },
}

export const mfaEndpoints = [
  mfaSetupEndpoint,
  mfaVerifyEnrollmentEndpoint,
  mfaVerifyEndpoint,
  mfaResetEndpoint,
  mfaLogoutEndpoint,
  mfaStatusEndpoint,
]
