'use client'

import React, { useCallback, useEffect, useState } from 'react'

import './index.scss'

type SubscriberRow = {
  id: string
  email: string
  status: string
  source: string
  confirmed_at: string | null
  esp_synced_at: string | null
  web_profile_id: string | null
  created_at: string
}

const baseClass = 'newsletter-subscribers-view'

export const NewsletterSubscribersView: React.FC = () => {
  const [rows, setRows] = useState<SubscriberRow[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({ status: '', from: '', to: '' })
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    params.set('limit', '50')

    const res = await fetch(`/api/newsletter-subscribers?${params}`, { credentials: 'include' })
    if (!res.ok) {
      setError(res.status === 403 ? 'Acceso denegado' : 'Error al cargar suscriptores')
      return
    }
    const data = await res.json()
    setRows(data.docs)
    setTotal(data.totalDocs)
  }, [filters])

  useEffect(() => {
    void load()
  }, [load])

  const exportCsv = async () => {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    params.set('export', 'true')
    const res = await fetch(`/api/newsletter-subscribers?${params}`, { credentials: 'include' })
    if (!res.ok) {
      setError('Exportación no permitida')
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'newsletter-subscribers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const runAction = async (subscriberId: string, action: 'resend' | 'resync') => {
    setBusyId(subscriberId)
    setError(null)
    try {
      const res = await fetch('/api/newsletter-subscribers/actions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, subscriberId }),
      })
      if (!res.ok) {
        setError('Acción no completada')
        return
      }
      await load()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className={baseClass}>
      <h1>Suscriptores newsletter</h1>
      <div className={`${baseClass}__filters`}>
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmado</option>
          <option value="unsubscribed">Baja</option>
        </select>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
        />
        <button type="button" onClick={() => void load()}>
          Filtrar
        </button>
        <button type="button" onClick={() => void exportCsv()}>
          Exportar CSV
        </button>
      </div>
      {error ? <p className={`${baseClass}__error`}>{error}</p> : null}
      <p>
        {total} suscriptor{total === 1 ? '' : 'es'}
      </p>
      <table className={`${baseClass}__table`}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Estado</th>
            <th>Origen</th>
            <th>Confirmado</th>
            <th>ESP sync</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.email}</td>
              <td>{row.status}</td>
              <td>{row.source}</td>
              <td>{row.confirmed_at ? new Date(row.confirmed_at).toLocaleString('es-ES') : '—'}</td>
              <td>{row.esp_synced_at ? new Date(row.esp_synced_at).toLocaleString('es-ES') : '—'}</td>
              <td>
                {row.status === 'pending' ? (
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => void runAction(row.id, 'resend')}
                  >
                    Reenviar confirmación
                  </button>
                ) : null}
                {row.status === 'confirmed' ? (
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => void runAction(row.id, 'resync')}
                  >
                    Resync ESP
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
