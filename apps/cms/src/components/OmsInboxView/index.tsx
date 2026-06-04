'use client'

import React, { useCallback, useEffect, useState } from 'react'

import '../OmsViews/oms-views.scss'

type InboxRow = {
  id: number
  orderNumber: string | null
  createdAt: string
  customerLabel: string
  amount: number | null
  jeyjoStatus: string | null
  origin: string | null
  stockValidationPending: boolean | null
  adminUrl: string
}

const STATUS_OPTIONS = [
  '',
  'pending_payment',
  'pending_confirmation',
  'confirmed',
  'preparing',
  'shipped',
  'delivered',
  'cancelled',
]

const NEXT_STATUS: Record<string, string> = {
  pending_payment: 'confirmed',
  pending_confirmation: 'confirmed',
  confirmed: 'preparing',
  preparing: 'shipped',
  shipped: 'delivered',
}

const baseClass = 'oms-view'

export const OmsInboxView: React.FC = () => {
  const [rows, setRows] = useState<InboxRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [origin, setOrigin] = useState('')
  const [jeyjoStatus, setJeyjoStatus] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setError(null)
    const params = new URLSearchParams()
    if (origin) params.set('origin', origin)
    if (jeyjoStatus) params.set('jeyjoStatus', jeyjoStatus)
    if (search.trim()) params.set('search', search.trim())

    const res = await fetch(`/api/orders/inbox-summary?${params}`, { credentials: 'include' })
    if (!res.ok) {
      setError(res.status === 403 ? 'Acceso denegado' : 'Error al cargar bandeja OMS')
      return
    }
    const data = await res.json()
    setRows(data.docs ?? [])
    setSelected(new Set())
  }, [origin, jeyjoStatus, search])

  useEffect(() => {
    void load()
  }, [load])

  const patchStatus = async (id: number, status: string) => {
    setBusyId(id)
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jeyjoStatus: status }),
    })
    setBusyId(null)
    if (!res.ok) {
      setError(await res.text().catch(() => 'No se pudo actualizar estado'))
      return
    }
    void load()
  }

  const exportOrders = async (ids: number[]) => {
    setError(null)
    const res = await fetch('/api/orders/export-avansuite', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderIds: ids }),
    })
    if (!res.ok) {
      setError(await res.text().catch(() => 'Exportación fallida'))
      return
    }
    const blob = await res.blob()
    const disposition = res.headers.get('Content-Disposition') ?? ''
    const match = disposition.match(/filename="([^"]+)"/)
    const filename = match?.[1] ?? 'pedidos-avansuite.xlsx'
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    void load()
  }

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const formatDate = (iso: string) => new Date(iso).toLocaleString('es-ES')

  const formatAmount = (n: number | null) =>
    n == null ? '—' : `${Number(n).toFixed(2)} €`

  return (
    <div className={baseClass}>
      <nav className={`${baseClass}__nav`}>
        <a href="/admin/oms">Bandeja OMS</a>
        <a href="/admin/oms/eva">Pedidos IA (EVA)</a>
        <a href="/admin/collections/orders">Colección Pedidos</a>
      </nav>
      <h1>Bandeja de pedidos web</h1>
      <p className={`${baseClass}__hint`}>RF-025 / US-17 — filtros, estados y exportación Avansuite.</p>
      {error && <p className={`${baseClass}__error`}>{error}</p>}

      <div className={`${baseClass}__toolbar`}>
        <label>
          Origen
          <select value={origin} onChange={(e) => setOrigin(e.target.value)}>
            <option value="">Todos</option>
            <option value="b2c">B2C</option>
            <option value="b2b">B2B</option>
            <option value="eva">EVA</option>
          </select>
        </label>
        <label>
          Estado
          <select value={jeyjoStatus} onChange={(e) => setJeyjoStatus(e.target.value)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s || 'all'} value={s}>
                {s || 'Todos'}
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
            placeholder="Nº pedido, email…"
          />
        </label>
        <button type="button" onClick={() => void load()}>
          Filtrar
        </button>
        {selected.size > 0 && (
          <button type="button" onClick={() => void exportOrders([...selected])}>
            Exportar selección ({selected.size})
          </button>
        )}
      </div>

      <table className={`${baseClass}__table`}>
        <thead>
          <tr>
            <th />
            <th>Pedido</th>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Importe</th>
            <th>Estado</th>
            <th>Origen</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const next = row.jeyjoStatus ? NEXT_STATUS[row.jeyjoStatus] : undefined
            return (
              <tr key={row.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggleSelect(row.id)}
                  />
                </td>
                <td>
                  <a href={row.adminUrl}>{row.orderNumber ?? row.id}</a>
                  {row.stockValidationPending && (
                    <span className={`${baseClass}__badge`}> Stock</span>
                  )}
                </td>
                <td>{formatDate(row.createdAt)}</td>
                <td>{row.customerLabel}</td>
                <td>{formatAmount(row.amount)}</td>
                <td>{row.jeyjoStatus ?? '—'}</td>
                <td>{row.origin ?? '—'}</td>
                <td>
                  <div className={`${baseClass}__actions`}>
                    {next && (
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => void patchStatus(row.id, next)}
                      >
                        → {next}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => void exportOrders([row.id])}
                    >
                      Exportar
                    </button>
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
