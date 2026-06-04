'use client'

import React, { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@payloadcms/ui'

import './index.scss'

const baseClass = 'mfa-gate'

type MfaStep = 'loading' | 'enroll' | 'verify' | 'ready'

export const MfaGate: React.FC = () => {
  const { user } = useAuth()
  const [step, setStep] = useState<MfaStep>('loading')
  const [uri, setUri] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const staffRoles = (user as { staffRoles?: string[] } | null)?.staffRoles
  const isStaffUser = Boolean(staffRoles?.length)
  const twoFactorEnabled = Boolean((user as { twoFactorEnabled?: boolean } | null)?.twoFactorEnabled)

  const checkMfaSession = useCallback(async () => {
    if (!isStaffUser) {
      setStep('ready')
      return
    }

    if (!twoFactorEnabled) {
      setStep('enroll')
      return
    }

    const res = await fetch('/api/users/me', { credentials: 'include' })
    if (!res.ok) {
      setStep('verify')
      return
    }

    const meRes = await fetch('/api/mfa/status', { credentials: 'include' }).catch(() => null)
    if (meRes?.ok) {
      const data = await meRes.json()
      setStep(data.verified ? 'ready' : 'verify')
    } else {
      setStep('verify')
    }
  }, [isStaffUser, twoFactorEnabled])

  useEffect(() => {
    void checkMfaSession()
  }, [checkMfaSession])

  const startEnrollment = async () => {
    setError(null)
    const res = await fetch('/api/users/mfa/setup', { method: 'POST', credentials: 'include' })
    if (!res.ok) {
      setError('No se pudo iniciar el enrolamiento MFA')
      return
    }
    const data = await res.json()
    setUri(data.uri)
    setSecret(data.secret)
  }

  useEffect(() => {
    if (step === 'enroll' && !uri) {
      void startEnrollment()
    }
  }, [step, uri])

  const submitCode = async (path: string) => {
    setError(null)
    const res = await fetch(path, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    if (!res.ok) {
      setError('Código TOTP inválido')
      return
    }
    setStep('ready')
    window.location.reload()
  }

  if (!isStaffUser || step === 'ready' || step === 'loading') {
    return null
  }

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__panel`}>
        <h2>Autenticación en dos pasos (TOTP)</h2>
        {step === 'enroll' && (
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
        {step === 'verify' && (
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
