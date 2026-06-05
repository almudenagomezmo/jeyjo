'use client'

import React, { useCallback, useEffect, useState } from 'react'

import './index.scss'

type SkaiStatus = {
  adapterKind: string
  health: { ok: boolean; message?: string }
  metrics: {
    activeConversations: number
    conversationsLast30Days: number
    unresolvedQueries: Array<{ id: string; label: string }>
  }
  settings: {
    enabled?: boolean
    businessHours?: string
    outOfHoursMessage?: string
    fallbackPhone?: string
    fallbackEmail?: string
    fallbackWhatsapp?: string
  }
  widget: { widgetId: string; scriptUrl: string | null } | null
}

const baseClass = 'skai-config-view'

export const SkaiConfigView: React.FC = () => {
  const [status, setStatus] = useState<SkaiStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [testToken, setTestToken] = useState<string | null>(null)
  const [form, setForm] = useState({
    enabled: true,
    businessHours: '',
    outOfHoursMessage: '',
    fallbackPhone: '',
    fallbackEmail: '',
    fallbackWhatsapp: '',
  })

  const load = useCallback(async () => {
    setError(null)
    const res = await fetch('/api/skai/status', { credentials: 'include' })
    if (!res.ok) {
      setError(res.status === 403 ? 'Acceso denegado (solo superadmin)' : 'Error al cargar SKAI')
      return
    }
    const body = (await res.json()) as SkaiStatus
    setStatus(body)
    setForm({
      enabled: body.settings.enabled ?? true,
      businessHours: body.settings.businessHours ?? '',
      outOfHoursMessage: body.settings.outOfHoursMessage ?? '',
      fallbackPhone: body.settings.fallbackPhone ?? '',
      fallbackEmail: body.settings.fallbackEmail ?? '',
      fallbackWhatsapp: body.settings.fallbackWhatsapp ?? '',
    })
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const saveSettings = async () => {
    setBusy(true)
    setError(null)
    const res = await fetch('/api/globals/skaiSettings', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enabled: form.enabled,
        businessHours: form.businessHours,
        outOfHoursMessage: form.outOfHoursMessage,
        fallbackPhone: form.fallbackPhone,
        fallbackEmail: form.fallbackEmail,
        fallbackWhatsapp: form.fallbackWhatsapp,
      }),
    })
    setBusy(false)
    if (!res.ok) {
      setError('No se pudo guardar la configuración')
      return
    }
    await load()
  }

  const runTest = async () => {
    setBusy(true)
    const res = await fetch('/api/skai/test-token', {
      method: 'POST',
      credentials: 'include',
    })
    setBusy(false)
    if (!res.ok) {
      setError('No se pudo generar token de prueba')
      return
    }
    const body = (await res.json()) as { contextToken: string }
    setTestToken(body.contextToken)
  }

  return (
    <div className={baseClass}>
      <h1>Configuración SKAI / EVA</h1>
      <p className={`${baseClass}__hint`}>US-20 — horarios, contacto y métricas del asistente.</p>
      {error && <p className={`${baseClass}__error`}>{error}</p>}

      {status && (
        <>
          <div className={`${baseClass}__grid`}>
            <div className={`${baseClass}__card`}>
              <div className={`${baseClass}__label`}>Adaptador</div>
              <div className={`${baseClass}__value`}>{status.adapterKind}</div>
              <p>{status.health.ok ? 'Conexión OK' : status.health.message ?? 'Sin conexión'}</p>
            </div>
            <div className={`${baseClass}__card`}>
              <div className={`${baseClass}__label`}>Conversaciones (30 días)</div>
              <div className={`${baseClass}__value`}>{status.metrics.conversationsLast30Days}</div>
              <p>Activas ahora: {status.metrics.activeConversations}</p>
            </div>
            <div className={`${baseClass}__card`}>
              <div className={`${baseClass}__label`}>Widget ID</div>
              <div>{status.widget?.widgetId ?? '—'}</div>
            </div>
          </div>

          <section>
            <h2>Preguntas no resueltas (muestra)</h2>
            {status.metrics.unresolvedQueries.length === 0 ? (
              <p>Sin datos.</p>
            ) : (
              <ul className={`${baseClass}__list`}>
                {status.metrics.unresolvedQueries.map((q) => (
                  <li key={q.id}>{q.label}</li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2>Configuración operativa</h2>
            <div className={`${baseClass}__form-row`}>
              <label>
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
                />{' '}
                Widget activo
              </label>
            </div>
            <div className={`${baseClass}__form-row`}>
              <label htmlFor="skai-hours">Horario de atención</label>
              <input
                id="skai-hours"
                value={form.businessHours}
                onChange={(e) => setForm((f) => ({ ...f, businessHours: e.target.value }))}
              />
            </div>
            <div className={`${baseClass}__form-row`}>
              <label htmlFor="skai-oos">Mensaje fuera de horario</label>
              <textarea
                id="skai-oos"
                rows={3}
                value={form.outOfHoursMessage}
                onChange={(e) => setForm((f) => ({ ...f, outOfHoursMessage: e.target.value }))}
              />
            </div>
            <div className={`${baseClass}__form-row`}>
              <label htmlFor="skai-phone">Teléfono</label>
              <input
                id="skai-phone"
                value={form.fallbackPhone}
                onChange={(e) => setForm((f) => ({ ...f, fallbackPhone: e.target.value }))}
              />
            </div>
            <div className={`${baseClass}__form-row`}>
              <label htmlFor="skai-email">Email</label>
              <input
                id="skai-email"
                type="email"
                value={form.fallbackEmail}
                onChange={(e) => setForm((f) => ({ ...f, fallbackEmail: e.target.value }))}
              />
            </div>
            <div className={`${baseClass}__form-row`}>
              <label htmlFor="skai-wa">WhatsApp</label>
              <input
                id="skai-wa"
                value={form.fallbackWhatsapp}
                onChange={(e) => setForm((f) => ({ ...f, fallbackWhatsapp: e.target.value }))}
              />
            </div>
            <button type="button" disabled={busy} onClick={() => void saveSettings()}>
              Guardar configuración
            </button>
          </section>

          <section className={`${baseClass}__test-panel`}>
            <h2>Probar EVA</h2>
            <p>Genera un token de contexto anónimo de prueba (sin datos de cliente).</p>
            <button type="button" disabled={busy} onClick={() => void runTest()}>
              Generar token de prueba
            </button>
            {testToken && (
              <pre style={{ marginTop: '1rem', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                {testToken}
              </pre>
            )}
          </section>
        </>
      )}
    </div>
  )
}
