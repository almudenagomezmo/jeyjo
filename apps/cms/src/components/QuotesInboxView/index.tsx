'use client'

import React, { useCallback, useEffect, useState } from 'react'

import '../OmsViews/oms-views.scss'

type QuoteInboxRow = {
  id: number
  quoteNumber: string | null
  createdAt: string
  customerLabel: string
  amount: number | null
  status: string | null
  segment: string | null
  emailSentAt: string | null
  convertedOrderId: number | null
  adminUrl: string
  orderAdminUrl: string | null
}

const STATUS_OPTIONS = ['', 'requested', 'in_review', 'sent', 'accepted', 'ordered', 'cancelled']

const STATUS_LABELS: Record<string, string> = {
  requested: 'Solicitado',
  in_review: 'En revisión',
  sent: 'Enviado',
  accepted: 'Aceptado',
  ordered: 'Pedido',
  cancelled: 'Cancelado',
}

const NEXT_STATUS: Record<string, string> = {
  requested: 'in_review',
  in_review: 'sent',
  sent: 'accepted',
}

const baseClass = 'oms-view'

export const QuotesInboxView: React.FC = () => {
  const [rows, setRows] = useState<QuoteInboxRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [status, setStatus] = useState('')
  const [segment, setSegment] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setError(null)
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (segment) params.set('segment', segment)
    if (search.trim()) params.set('search', search.trim())

    const res = await fetch(`/api/quotes/inbox-summary?${params}`, { credentials: 'include' })
    if (!res.ok) {
      setError(res.status === 403 ? 'Acceso denegado' : 'Error al cargar presupuestos')
      return
    }
    const data = await res.json()
    setRows(data.docs ?? [])
  }, [status, segment, search])

  useEffect(() => {
    void load()
  }, [load])

  const patchStatus = async (id: number, next: string) => {
    setBusyId(id)
    const res = await fetch(`/api/quotes/${id}/status`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    setBusyId(null)
    if (!res.ok) {
      setError(await res.text().catch(() => 'No se pudo actualizar estado'))
      return
    }
    void load()
  }

  const convertToOrder = async (id: number) => {
    setBusyId(id)
    const res = await fetch(`/api/quotes/${id}/convert-to-order`, {
      method: 'POST',
      credentials: 'include',
    })
    setBusyId(null)
    if (!res.ok) {
      setError(await res.text().catch(() => 'No se pudo convertir a pedido'))
      return
    }
    void load()
  }

  const formatDate = (iso: string) => new Date(iso).toLocaleString('es-ES')
  const formatAmount = (n: number | null) => (n == null ? '—' : `${Number(n).toFixed(2)} €`)

  return (
    <div className={baseClass}>
      <nav className={`${baseClass}__nav`}>
        <a href="/admin/oms">Bandeja OMS</a>
        <a href="/admin/quotes">Presupuestos</a>
        <a href="/admin/rma">RMA e incidencias</a>
        <a href="/admin/collections/quotes">Colección Presupuestos</a>
      </nav>
      <h1>Bandeja de presupuestos</h1>
      <p className={`${baseClass}__hint`}>RF-015 / US-05 — estados y conversión a pedido.</p>
      {error && <p className={`${baseClass}__error`}>{error}</p>}

      <div className={`${baseClass}__toolbar`}>
        <label>
          Estado
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s || 'all'} value={s}>
                {s ? (STATUS_LABELS[s] ?? s) : 'Todos'}
              </option>
            ))}
          </select>
        </label>
        <label>
          Segmento
          <select value={segment} onChange={(e) => setSegment(e.target.value)}>
            <option value="">Todos</option>
            <option value="b2c">B2C</option>
            <option value="b2b">B2B</option>
          </select>
        </label>
        <label>
          Buscar
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nº presupuesto, email…"
          />
        </label>
        <button type="button" onClick={() => void load()}>
          Filtrar
        </button>
      </div>

      <table className={`${baseClass}__table`}>
        <thead>
          <tr>
            <th>Presupuesto</th>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Importe</th>
            <th>Estado</th>
            <th>Segmento</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const next = row.status ? NEXT_STATUS[row.status] : undefined
            const showConvert = row.status === 'accepted' && !row.convertedOrderId
            return (
              <tr key={row.id}>
                <td>
                  <a href={row.adminUrl}>{row.quoteNumber ?? row.id}</a>
                  {!row.emailSentAt && row.status === 'requested' && (
                    <span className={`${baseClass}__badge`}> Email</span>
                  )}
                  {row.orderAdminUrl && (
                    <>
                      {' '}
                      <a href={row.orderAdminUrl} className={`${baseClass}__link-secondary`}>
                        Pedido
                      </a>
                    </>
                  )}
                </td>
                <td>{formatDate(row.createdAt)}</td>
                <td>{row.customerLabel}</td>
                <td>{formatAmount(row.amount)}</td>
                <td>{row.status ? (STATUS_LABELS[row.status] ?? row.status) : '—'}</td>
                <td>{row.segment ?? '—'}</td>
                <td>
                  <div className={`${baseClass}__actions`}>
                    {next && row.status !== 'accepted' && (
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => void patchStatus(row.id, next)}
                      >
                        → {STATUS_LABELS[next] ?? next}
                      </button>
                    )}
                    {showConvert && (
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => void convertToOrder(row.id)}
                      >
                        Convertir a pedido
                      </button>
                    )}
                    {row.status !== 'cancelled' && row.status !== 'ordered' && (
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => void patchStatus(row.id, 'cancelled')}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
