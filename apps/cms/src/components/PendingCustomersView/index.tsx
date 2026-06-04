'use client'

import React, { useCallback, useEffect, useState } from 'react'

import './index.scss'

type PendingRow = {
  id: string
  commercial_name: string
  email: string
  tax_id: string | null
  phone: string | null
  customer_group: number
  created_at: string
  is_company: boolean
}

const baseClass = 'pending-customers-view'

export const PendingCustomersView: React.FC = () => {
  const [rows, setRows] = useState<PendingRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    const res = await fetch('/api/pending-customers', { credentials: 'include' })
    if (!res.ok) {
      setError(res.status === 403 ? 'Acceso denegado' : 'Error al cargar pendientes')
      return
    }
    const data = await res.json()
    setRows(data.docs ?? [])
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const validate = async (id: string, customerGroup: number) => {
    setBusyId(id)
    setError(null)
    const res = await fetch(`/next/customers/${id}/validate`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerGroup }),
    })
    setBusyId(null)
    if (!res.ok) {
      const text = await res.text()
      setError(text || 'No se pudo validar')
      return
    }
    void load()
  }

  return (
    <div className={baseClass}>
      <h1>Clientes pendientes de validación</h1>
      <p className={`${baseClass}__hint`}>
        Registros con <code>validated_at</code> vacío desde el storefront (RF-004).
      </p>
      {error && <p className={`${baseClass}__error`}>{error}</p>}
      <table className={`${baseClass}__table`}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>CIF</th>
            <th>Teléfono</th>
            <th>Alta</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.commercial_name}</td>
              <td>{row.email}</td>
              <td>{row.tax_id ?? '—'}</td>
              <td>{row.phone ?? '—'}</td>
              <td>{new Date(row.created_at).toLocaleString('es-ES')}</td>
              <td className={`${baseClass}__actions`}>
                <button
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => void validate(row.id, 1)}
                >
                  B2C
                </button>
                <button
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => void validate(row.id, 2)}
                >
                  B2B (02)
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && !error && <p>No hay clientes pendientes.</p>}
    </div>
  )
}
