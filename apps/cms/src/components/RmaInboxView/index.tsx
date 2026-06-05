'use client'

import React, { useCallback, useEffect, useState } from 'react'

import { rmaReasonLabel } from '@/lib/rma/reason-labels'

import '../OmsViews/oms-views.scss'

type RmaInboxRow = {
  id: number
  rmaNumber: string | null
  createdAt: string
  customerLabel: string
  articleSku: string | null
  deliveryNoteNumber: string | null
  reason: string | null
  status: string | null
  emailSentAt: string | null
  adminUrl: string
}

const STATUS_OPTIONS = ['', 'requested', 'in_review', 'authorized', 'rejected']

const STATUS_LABELS: Record<string, string> = {
  requested: 'Solicitada',
  in_review: 'En revisión',
  authorized: 'Autorizada',
  rejected: 'Rechazada',
}

const NEXT_STATUS: Record<string, string[]> = {
  requested: ['in_review'],
  in_review: ['authorized', 'rejected'],
}

const baseClass = 'oms-view'

export const RmaInboxView: React.FC = () => {
  const [rows, setRows] = useState<RmaInboxRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setError(null)
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (search.trim()) params.set('search', search.trim())

    const res = await fetch(`/api/rma-incidents/inbox-summary?${params}`, {
      credentials: 'include',
    })
    if (!res.ok) {
      setError(res.status === 403 ? 'Acceso denegado' : 'Error al cargar incidencias RMA')
      return
    }
    const data = await res.json()
    setRows(data.docs ?? [])
  }, [status, search])

  useEffect(() => {
    void load()
  }, [load])

  const patchStatus = async (id: number, next: string) => {
    setBusyId(id)
    const res = await fetch(`/api/rma-incidents/${id}/status`, {
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

  const formatDate = (iso: string) => new Date(iso).toLocaleString('es-ES')

  return (
    <div className={baseClass}>
      <nav className={`${baseClass}__nav`}>
        <a href="/admin/oms">Bandeja OMS</a>
        <a href="/admin/quotes">Presupuestos</a>
        <a href="/admin/rma">RMA e incidencias</a>
        <a href="/admin/collections/rma-incidents">Colección RMA</a>
      </nav>
      <h1>Bandeja RMA e incidencias</h1>
      <p className={`${baseClass}__hint`}>RF-021 / US-13 — autorización de devoluciones.</p>
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
          Buscar
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nº RMA, SKU, albarán…"
          />
        </label>
        <button type="button" onClick={() => void load()}>
          Filtrar
        </button>
      </div>

      <table className={`${baseClass}__table`}>
        <thead>
          <tr>
            <th>RMA</th>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Referencia</th>
            <th>Albarán</th>
            <th>Motivo</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const nextOptions = row.status ? (NEXT_STATUS[row.status] ?? []) : []
            return (
              <tr key={row.id}>
                <td>
                  <a href={row.adminUrl}>{row.rmaNumber ?? row.id}</a>
                  {!row.emailSentAt && row.status === 'requested' && (
                    <span className={`${baseClass}__badge`} title="Email no enviado">
                      {' '}
                      Email
                    </span>
                  )}
                </td>
                <td>{formatDate(row.createdAt)}</td>
                <td>{row.customerLabel}</td>
                <td>{row.articleSku ?? '—'}</td>
                <td>{row.deliveryNoteNumber ?? '—'}</td>
                <td>{row.reason ? rmaReasonLabel(row.reason) : '—'}</td>
                <td>{row.status ? (STATUS_LABELS[row.status] ?? row.status) : '—'}</td>
                <td>
                  <div className={`${baseClass}__actions`}>
                    {nextOptions.map((next) => (
                      <button
                        key={next}
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => void patchStatus(row.id, next)}
                      >
                        → {STATUS_LABELS[next] ?? next}
                      </button>
                    ))}
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
