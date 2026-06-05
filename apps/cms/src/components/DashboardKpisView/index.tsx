'use client'

import React, { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@payloadcms/ui'

import type { DashboardSummary } from '@/lib/dashboard/types'

import './index.scss'

const baseClass = 'dashboard-kpis-view'

type PeriodPreset = 'today' | 'yesterday' | 'week' | 'month' | 'custom'

const PRESETS: { id: PeriodPreset; label: string }[] = [
  { id: 'today', label: 'Hoy' },
  { id: 'yesterday', label: 'Ayer' },
  { id: 'week', label: 'Esta semana' },
  { id: 'month', label: 'Este mes' },
  { id: 'custom', label: 'Personalizado' },
]

function formatMoney(n: number): string {
  return `${n.toFixed(2)} €`
}

function formatPercent(rate: number | null): string {
  if (rate == null) return '—'
  return `${(rate * 100).toFixed(1)} %`
}

function formatLag(seconds: number): string {
  if (seconds <= 0) return '0 s'
  if (seconds < 60) return `${seconds} s`
  return `${Math.floor(seconds / 60)} min`
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-ES')
}

export const DashboardKpisView: React.FC = () => {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mfaReady, setMfaReady] = useState(false)
  const [period, setPeriod] = useState<PeriodPreset>('today')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const staffRoles = (user as { staffRoles?: string[] } | null)?.staffRoles
  const isStaffUser = Boolean(staffRoles?.length)

  const checkMfa = useCallback(async () => {
    if (!isStaffUser) {
      setMfaReady(true)
      return
    }
    const res = await fetch('/api/users/mfa/status', { credentials: 'include' }).catch(() => null)
    if (!res?.ok) {
      setMfaReady(false)
      return
    }
    const body = (await res.json()) as { verified?: boolean }
    setMfaReady(Boolean(body.verified))
  }, [isStaffUser])

  const load = useCallback(async () => {
    setError(null)
    const params = new URLSearchParams({ period })
    if (period === 'custom') {
      if (customFrom) params.set('from', customFrom)
      if (customTo) params.set('to', customTo)
    }
    const res = await fetch(`/api/dashboard/summary?${params}`, { credentials: 'include' })
    if (!res.ok) {
      setError(res.status === 401 ? 'Sesión no válida' : 'Error al cargar el dashboard')
      return
    }
    setData(await res.json())
  }, [period, customFrom, customTo])

  useEffect(() => {
    void checkMfa()
  }, [checkMfa])

  useEffect(() => {
    if (!mfaReady || !isStaffUser) return
    void load()
    const timer = window.setInterval(() => void load(), 60_000)
    return () => window.clearInterval(timer)
  }, [mfaReady, isStaffUser, load])

  if (!isStaffUser || !mfaReady) return null

  const showFinancial = data?.roleScope === 'full'

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <h1>Dashboard KPIs</h1>
        {showFinancial && (
          <div className={`${baseClass}__period`}>
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={period === p.id ? 'is-active' : ''}
                onClick={() => setPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
            {period === 'custom' && (
              <div className={`${baseClass}__custom-dates`}>
                <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
                <span>—</span>
                <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
                <button type="button" onClick={() => void load()}>
                  Aplicar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className={`${baseClass}__error`}>{error}</p>}

      {data?.roleScope === 'minimal' && (
        <div className={`${baseClass}__minimal`}>
          <p>Bienvenido al backoffice Jeyjo. Los indicadores de ventas no están disponibles para tu rol.</p>
        </div>
      )}

      {data && (
        <section className={`${baseClass}__section`}>
          <h2>Cola indexación Qdrant (RF-009)</h2>
          <div className={`${baseClass}__cards`}>
            <div className={`${baseClass}__card`}>
              <div className={`${baseClass}__card-label`}>Pendientes</div>
              <div className={`${baseClass}__card-value`}>{data.searchQueue.pending}</div>
            </div>
            <div className={`${baseClass}__card`}>
              <div className={`${baseClass}__card-label`}>Procesando</div>
              <div className={`${baseClass}__card-value`}>{data.searchQueue.processing}</div>
            </div>
            <div className={`${baseClass}__card`}>
              <div className={`${baseClass}__card-label`}>Errores</div>
              <div className={`${baseClass}__card-value`}>{data.searchQueue.error}</div>
            </div>
            <div className={`${baseClass}__card`}>
              <div className={`${baseClass}__card-label`}>Lag cola</div>
              <div className={`${baseClass}__card-value`}>
                {formatLag(data.searchQueue.oldestPendingAgeSec)}
              </div>
            </div>
            <div className={`${baseClass}__card`}>
              <div className={`${baseClass}__card-label`}>Cobertura Qdrant</div>
              <div className={`${baseClass}__card-value`}>
                {formatPercent(data.qdrantCoverage.ratio)}
              </div>
            </div>
          </div>
          <p className={`${baseClass}__empty`}>
            Puntos Qdrant: {data.qdrantCoverage.qdrantProductPoints ?? '—'} · Publicados Payload:{' '}
            {data.qdrantCoverage.publishedProductCount}
          </p>
        </section>
      )}

      {showFinancial && data && (
        <>
          <p className={`${baseClass}__empty`}>Periodo: {data.period.label}</p>
          <div className={`${baseClass}__cards`}>
            <div className={`${baseClass}__card`}>
              <div className={`${baseClass}__card-label`}>Pedidos</div>
              <div className={`${baseClass}__card-value`}>{data.sales.orderCount}</div>
            </div>
            <div className={`${baseClass}__card`}>
              <div className={`${baseClass}__card-label`}>Ventas</div>
              <div className={`${baseClass}__card-value`}>{formatMoney(data.sales.revenue)}</div>
            </div>
            <div className={`${baseClass}__card`}>
              <div className={`${baseClass}__card-label`}>Ticket medio</div>
              <div className={`${baseClass}__card-value`}>{formatMoney(data.sales.avgTicket)}</div>
            </div>
            <div className={`${baseClass}__card`}>
              <div className={`${baseClass}__card-label`}>Conversión</div>
              <div className={`${baseClass}__card-value`}>{formatPercent(data.conversion.rate)}</div>
            </div>
            <div className={`${baseClass}__card`}>
              <div className={`${baseClass}__card-label`}>Visitantes activos</div>
              <div className={`${baseClass}__card-value`}>{data.realtime.activeVisitors}</div>
            </div>
            <div className={`${baseClass}__card`}>
              <div className={`${baseClass}__card-label`}>Carritos activos</div>
              <div className={`${baseClass}__card-value`}>{data.realtime.activeCarts}</div>
            </div>
          </div>

          <div className={`${baseClass}__grid`}>
            <section className={`${baseClass}__section`}>
              <h2>Últimos pedidos</h2>
              {data.recentOrders.length === 0 ? (
                <p className={`${baseClass}__empty`}>Sin pedidos recientes.</p>
              ) : (
                <table className={`${baseClass}__table`}>
                  <thead>
                    <tr>
                      <th>Pedido</th>
                      <th>Cliente</th>
                      <th>Importe</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <a href={row.adminUrl}>{row.orderNumber ?? row.id}</a>
                        </td>
                        <td>{row.customerLabel}</td>
                        <td>{row.total == null ? '—' : formatMoney(row.total)}</td>
                        <td>{row.jeyjoStatus ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className={`${baseClass}__section`}>
              <h2>
                Monitorización EVA
                {!data.eva.isLive && (
                  <span className={`${baseClass}__preview-badge`}>preview</span>
                )}
              </h2>
              <p className={`${baseClass}__empty`}>
                Conversaciones activas: {data.eva.activeConversations}
                {' · '}
                <a href="/admin/oms/eva">Cola pedidos EVA</a>
              </p>
              {data.eva.unresolvedQueries.length === 0 ? (
                <p className={`${baseClass}__empty`}>Sin consultas pendientes.</p>
              ) : (
                <ul>
                  {data.eva.unresolvedQueries.map((item) => (
                    <li key={item.id}>
                      {item.adminUrl ? <a href={item.adminUrl}>{item.label}</a> : item.label}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}

      {data && data.alerts.length > 0 && (
        <section className={`${baseClass}__section`}>
          <h2>Alertas de sistema</h2>
          {data.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`${baseClass}__alert ${baseClass}__alert--${alert.severity}`}
            >
              <div className={`${baseClass}__alert-title`}>
                {alert.href ? <a href={alert.href}>{alert.title}</a> : alert.title}
              </div>
              <div>{alert.description}</div>
              {alert.timestamp && (
                <div className={`${baseClass}__empty`}>{formatDateTime(alert.timestamp)}</div>
              )}
            </div>
          ))}
        </section>
      )}

      {data && data.alerts.length === 0 && data.roleScope !== 'minimal' && (
        <section className={`${baseClass}__section`}>
          <h2>Alertas de sistema</h2>
          <p className={`${baseClass}__empty`}>Sin alertas operativas.</p>
        </section>
      )}
    </div>
  )
}
