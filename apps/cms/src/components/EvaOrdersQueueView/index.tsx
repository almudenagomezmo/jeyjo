'use client'

import React, { useCallback, useEffect, useState } from 'react'

import '../OmsViews/oms-views.scss'

type EvaRow = {
  id: number
  orderNumber: string | null
  createdAt: string
  customerLabel: string
  amount: number | null
  jeyjoStatus: string | null
  adminUrl: string
}

const baseClass = 'oms-view'

export const EvaOrdersQueueView: React.FC = () => {
  const [rows, setRows] = useState<EvaRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState<Record<number, string>>({})

  const load = useCallback(async () => {
    setError(null)
    const res = await fetch('/api/orders/inbox-summary?evaQueue=true', {
      credentials: 'include',
    })
    if (!res.ok) {
      setError(res.status === 403 ? 'Acceso denegado' : 'Error al cargar cola EVA')
      return
    }
    const data = await res.json()
    setRows(data.docs ?? [])
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const validate = async (id: number) => {
    setBusyId(id)
    const res = await fetch('/api/orders/eva/validate', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: id }),
    })
    setBusyId(null)
    if (!res.ok) {
      setError(await res.text().catch(() => 'Validación fallida'))
      return
    }
    void load()
  }

  const reject = async (id: number) => {
    setBusyId(id)
    const res = await fetch('/api/orders/eva/reject', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: id, reason: rejectReason[id] ?? '' }),
    })
    setBusyId(null)
    if (!res.ok) {
      setError(await res.text().catch(() => 'Rechazo fallido'))
      return
    }
    void load()
  }

  return (
    <div className={baseClass}>
      <nav className={`${baseClass}__nav`}>
        <a href="/admin/oms">Bandeja OMS</a>
        <a href="/admin/oms/eva">Pedidos IA (EVA)</a>
      </nav>
      <h1>Pedidos IA — pendientes de validación</h1>
      <p className={`${baseClass}__hint`}>CA-BACKEND-003 — Revisar y validar antes de exportar a Avansuite.</p>
      {error && <p className={`${baseClass}__error`}>{error}</p>}

      <table className={`${baseClass}__table`}>
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Importe</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={6}>No hay pedidos EVA pendientes.</td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <a href={row.adminUrl}>{row.orderNumber ?? row.id}</a>
              </td>
              <td>{new Date(row.createdAt).toLocaleString('es-ES')}</td>
              <td>{row.customerLabel}</td>
              <td>{row.amount != null ? `${Number(row.amount).toFixed(2)} €` : '—'}</td>
              <td>{row.jeyjoStatus ?? '—'}</td>
              <td>
                <div className={`${baseClass}__actions`}>
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => void validate(row.id)}
                  >
                    Revisar y Validar
                  </button>
                  <input
                    type="text"
                    placeholder="Motivo rechazo"
                    value={rejectReason[row.id] ?? ''}
                    onChange={(e) =>
                      setRejectReason((prev) => ({ ...prev, [row.id]: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => void reject(row.id)}
                  >
                    Rechazar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
