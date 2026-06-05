'use client'

import React, { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@payloadcms/ui'

import './index.scss'

const baseClass = 'mfa-gate'

type MfaStep = 'loading' | 'enroll' | 'verify' | 'ready'
type MfaMode = 'email' | 'totp'

const defaultMfaMode: MfaMode = process.env.NODE_ENV === 'production' ? 'totp' : 'email'

export const MfaGate: React.FC = () => {
  const { user } = useAuth()
  const [step, setStep] = useState<MfaStep>('loading')
  const [mode, setMode] = useState<MfaMode | null>(null)
  const [sentToEmail, setSentToEmail] = useState<string | null>(null)
  const [uri, setUri] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const staffRoles = (user as { staffRoles?: string[] } | null)?.staffRoles
  const isStaffUser = Boolean(staffRoles?.length)
  const twoFactorEnabled = Boolean((user as { twoFactorEnabled?: boolean } | null)?.twoFactorEnabled)

  const checkMfaSession = useCallback(async () => {
    if (!isStaffUser) {
      setStep('ready')
      return
    }

    const meRes = await fetch('/api/users/mfa/status', { credentials: 'include' }).catch(() => null)
    if (meRes?.ok) {
      const data = (await meRes.json()) as { verified?: boolean; mode?: MfaMode }
      setMode(data.mode ?? defaultMfaMode)

      if (!twoFactorEnabled) {
        setStep('enroll')
        return
      }

      setStep(data.verified ? 'ready' : 'verify')
      return
    }

    setMode(defaultMfaMode)
    if (!twoFactorEnabled) {
      setStep('enroll')
      return
    }

    setStep('verify')
  }, [isStaffUser, twoFactorEnabled])

  useEffect(() => {
    void checkMfaSession()
  }, [checkMfaSession])

  const sendCode = useCallback(async () => {
    setError(null)
    setSending(true)
    try {
      const res = await fetch('/api/users/mfa/setup', { method: 'POST', credentials: 'include' })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null
        setError(data?.message || 'No se pudo enviar el código MFA')
        return
      }

      const data = (await res.json()) as {
        mode?: MfaMode
        email?: string
        secret?: string
        uri?: string
      }

      if (data.mode) setMode(data.mode)

      if (data.mode === 'email') {
        setSentToEmail(data.email || (user as { email?: string } | null)?.email || null)
        return
      }

      setUri(data.uri || null)
      setSecret(data.secret || null)
    } finally {
      setSending(false)
    }
  }, [user])

  useEffect(() => {
    if ((step === 'enroll' || step === 'verify') && mode === 'email' && !sentToEmail && !sending) {
      void sendCode()
    }
  }, [step, mode, sentToEmail, sending, sendCode])

  useEffect(() => {
    if (step === 'enroll' && mode === 'totp' && !uri) {
      void sendCode()
    }
  }, [step, mode, uri, sendCode])

  const submitCode = async (path: string) => {
    setError(null)
    const res = await fetch(path, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { message?: string } | null
      if (res.status >= 500) {
        setError(data?.message || 'Error del servidor. Inténtalo de nuevo.')
      } else {
        setError(
          data?.message ||
            (mode === 'email' ? 'Código inválido o caducado' : 'Código TOTP inválido'),
        )
      }
      return
    }
    setStep('ready')
    window.location.reload()
  }

  if (!isStaffUser || step === 'ready' || step === 'loading' || !mode) {
    return null
  }

  const isEmailMode = mode === 'email'

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__panel`}>
        <h2>
          {isEmailMode
            ? 'Verificación por email'
            : 'Autenticación en dos pasos (TOTP)'}
        </h2>

        {isEmailMode && (
          <>
            <p>
              {step === 'enroll'
                ? 'Te hemos enviado un código para activar la autenticación en dos pasos.'
                : 'Te hemos enviado un código de verificación a tu email.'}
            </p>
            {sentToEmail && (
              <p>
                <strong>Email:</strong> {sentToEmail}
              </p>
            )}
            <input
              type="text"
              inputMode="numeric"
              placeholder="Código de 6 dígitos"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button
              type="button"
              onClick={() =>
                submitCode(
                  step === 'enroll'
                    ? '/api/users/mfa/verify-enrollment'
                    : '/api/users/mfa/verify',
                )
              }
            >
              {step === 'enroll' ? 'Activar MFA' : 'Verificar'}
            </button>
            <button type="button" onClick={() => void sendCode()} disabled={sending}>
              {sending ? 'Enviando…' : 'Reenviar código'}
            </button>
          </>
        )}

        {!isEmailMode && step === 'enroll' && (
          <>
            <p>Escanea este código en Google Authenticator o introduce el secreto manualmente.</p>
            {secret && (
              <p>
                <strong>Secreto:</strong> <code>{secret}</code>
              </p>
            )}
            {uri && (
              <p>
                <strong>URI:</strong>{' '}
                <a href={uri} rel="noreferrer">
                  {uri}
                </a>
              </p>
            )}
            <input
              type="text"
              inputMode="numeric"
              placeholder="Código de 6 dígitos"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button type="button" onClick={() => submitCode('/api/users/mfa/verify-enrollment')}>
              Activar MFA
            </button>
          </>
        )}

        {!isEmailMode && step === 'verify' && (
          <>
            <p>Introduce el código TOTP de tu aplicación autenticadora.</p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Código de 6 dígitos"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button type="button" onClick={() => submitCode('/api/users/mfa/verify')}>
              Verificar
            </button>
          </>
        )}

        {error && <p className={`${baseClass}__error`}>{error}</p>}
      </div>
    </div>
  )
}
