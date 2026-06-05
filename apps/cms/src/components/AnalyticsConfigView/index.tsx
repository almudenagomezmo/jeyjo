'use client'

import React, { useCallback, useEffect, useState } from 'react'

import './index.scss'

type AnalyticsStatus = {
  ga4MeasurementId?: string | null
  merchantFeedEnabled?: boolean | null
  lastFeedGeneratedAt?: string | null
  feedOmittedCounts?: {
    missingImage?: number
    missingPrice?: number
    missingSku?: number
  } | null
  consecutiveFeedFailures?: number | null
  lastFeedErrorMessage?: string | null
  env: {
    ga4Enabled: boolean
    ga4MeasurementId: string | null
    merchantFeedEnabled: boolean
    merchantFeedBaseUrl: string | null
    feedPublicUrl: string
  }
}

const baseClass = 'analytics-config-view'

export const AnalyticsConfigView: React.FC = () => {
  const [status, setStatus] = useState<AnalyticsStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ga4MeasurementId, setGa4MeasurementId] = useState('')
  const [merchantFeedEnabled, setMerchantFeedEnabled] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    const res = await fetch('/api/analytics/status', { credentials: 'include' })
    if (!res.ok) {
      setError(res.status === 403 ? 'Acceso denegado (superadmin o mantenimiento)' : 'Error al cargar')
      return
    }
    const body = (await res.json()) as AnalyticsStatus
    setStatus(body)
    setGa4MeasurementId(body.ga4MeasurementId ?? '')
    setMerchantFeedEnabled(body.merchantFeedEnabled !== false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/analytics/status', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ga4MeasurementId, merchantFeedEnabled }),
      })
      if (!res.ok) {
        setError('No se pudo guardar la configuración')
        return
      }
      await load()
    } finally {
      setBusy(false)
    }
  }

  if (error && !status) {
    return <div className={baseClass}>{error}</div>
  }

  return (
    <div className={baseClass}>
      <h1>Analytics y Merchant Feed (RF-028)</h1>
      <p className={`${baseClass}__help`}>
        Las variables de entorno en Vercel son la fuente de verdad en runtime. Consulta{' '}
        <code>apps/storefront/.env.example</code> (GA4) y <code>apps/cms/.env.example</code>{' '}
        (MERCHANT_FEED_ENABLED, MERCHANT_FEED_BASE_URL, CRON_SECRET).
      </p>

      {status && (
        <section className={`${baseClass}__panel`}>
          <h2>Estado runtime (solo lectura)</h2>
          <ul>
            <li>
              GA4 tienda: {status.env.ga4Enabled ? 'activo' : 'desactivado'}{' '}
              {status.env.ga4MeasurementId ? `(${status.env.ga4MeasurementId})` : ''}
            </li>
            <li>Feed env: {status.env.merchantFeedEnabled ? 'activo' : 'desactivado'}</li>
            <li>
              URL feed pública:{' '}
              <a href={status.env.feedPublicUrl} target="_blank" rel="noreferrer">
                {status.env.feedPublicUrl}
              </a>
            </li>
            <li>
              Última generación:{' '}
              {status.lastFeedGeneratedAt
                ? new Date(status.lastFeedGeneratedAt).toLocaleString('es-ES')
                : '—'}
            </li>
            <li>
              Omitidos: imagen {status.feedOmittedCounts?.missingImage ?? 0}, precio{' '}
              {status.feedOmittedCounts?.missingPrice ?? 0}, SKU {status.feedOmittedCounts?.missingSku ?? 0}
            </li>
            {(status.consecutiveFeedFailures ?? 0) > 0 && (
              <li className={`${baseClass}__error`}>
                Fallos consecutivos cron: {status.consecutiveFeedFailures} —{' '}
                {status.lastFeedErrorMessage}
              </li>
            )}
          </ul>
        </section>
      )}

      <section className={`${baseClass}__panel`}>
        <h2>Configuración Payload (referencia)</h2>
        <label>
          GA4 Measurement ID
          <input
            value={ga4MeasurementId}
            onChange={(e) => setGa4MeasurementId(e.target.value)}
            placeholder="G-XXXXXXXXXX"
          />
        </label>
        <label className={`${baseClass}__checkbox`}>
          <input
            type="checkbox"
            checked={merchantFeedEnabled}
            onChange={(e) => setMerchantFeedEnabled(e.target.checked)}
          />
          Feed Merchant Center activo (kill switch)
        </label>
        <button type="button" disabled={busy} onClick={() => void save()}>
          {busy ? 'Guardando…' : 'Guardar'}
        </button>
      </section>

      <section className={`${baseClass}__panel`}>
        <h2>Checklist manual</h2>
        <ul>
          <li>GA4 DebugView: view_item, add_to_cart, begin_checkout, purchase tras pedido test.</li>
          <li>Validar feed XML en Google Merchant Center / Content API test tool.</li>
        </ul>
      </section>
    </div>
  )
}
