'use client'

import React, { useCallback, useEffect, useState } from 'react'

import '../OmsViews/oms-views.scss'

type ReviewInboxRow = {
  id: number
  status: string | null
  previousStatus: string | null
  productTitle: string | null
  skuErp: string | null
  rating: number | null
  authorDisplayName: string | null
  createdAt: string
  isReedition: boolean
  adminUrl: string
}

const STATUS_OPTIONS = ['pending', 'approved', 'rejected', 'all']

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
}

const baseClass = 'oms-view'

export const ProductReviewsInboxView: React.FC = () => {
  const [rows, setRows] = useState<ReviewInboxRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [status, setStatus] = useState('pending')
  const [search, setSearch] = useState('')
  const [rejectNote, setRejectNote] = useState<Record<number, string>>({})

  const load = useCallback(async () => {
    setError(null)
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (search.trim()) params.set('search', search.trim())

    const res = await fetch(`/api/product-reviews/inbox-summary?${params}`, {
      credentials: 'include',
    })
    if (!res.ok) {
      setError(res.status === 403 ? 'Acceso denegado' : 'Error al cargar valoraciones')
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
    const body: { status: string; rejectionNote?: string } = { status: next }
    if (next === 'rejected' && rejectNote[id]?.trim()) {
      body.rejectionNote = rejectNote[id].trim()
    }
    const res = await fetch(`/api/product-reviews/${id}/status`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setBusyId(null)
    if (!res.ok) {
      setError(await res.text().catch(() => 'No se pudo actualizar estado'))
      return
    }
    void load()
  }

  const deleteReview = async (id: number) => {
    if (!window.confirm('¿Eliminar esta valoración de forma permanente?')) return
    setBusyId(id)
    const res = await fetch(`/api/product-reviews/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    setBusyId(null)
    if (!res.ok) {
      setError(await res.text().catch(() => 'No se pudo eliminar'))
      return
    }
    void load()
  }

  const formatDate = (iso: string) => new Date(iso).toLocaleString('es-ES')

  return (
    <div className={baseClass}>
      <nav className={`${baseClass}__nav`}>
        <a href="/admin/collections/product-reviews">Colección valoraciones</a>
        <a href="/admin/collections/products">Productos</a>
      </nav>
      <h1>Bandeja de valoraciones</h1>
      <p className={`${baseClass}__hint`}>RF-012 / US-03 — moderación de reseñas de producto.</p>
      {error && <p className={`${baseClass}__error`}>{error}</p>}

      <div className={`${baseClass}__toolbar`}>
        <label>
          Estado
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'Todos' : (STATUS_LABELS[s] ?? s)}
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
            placeholder="SKU, autor…"
          />
        </label>
        <button type="button" onClick={() => void load()}>
          Filtrar
        </button>
      </div>

      <table className={`${baseClass}__table`}>
        <thead>
          <tr>
            <th>Estado</th>
            <th>Producto</th>
            <th>SKU</th>
            <th>Valoración</th>
            <th>Autor</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                {row.status ? (STATUS_LABELS[row.status] ?? row.status) : '—'}
                {row.isReedition && (
                  <span className={`${baseClass}__badge`} title="Re-edición">
                    {' '}
                    Re-edición
                  </span>
                )}
              </td>
              <td>
                <a href={row.adminUrl}>{row.productTitle ?? '—'}</a>
              </td>
              <td>{row.skuErp ?? '—'}</td>
              <td>{row.rating != null ? `${row.rating} ★` : '—'}</td>
              <td>{row.authorDisplayName ?? '—'}</td>
              <td>{formatDate(row.createdAt)}</td>
              <td>
                <div className={`${baseClass}__actions`}>
                  {row.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => void patchStatus(row.id, 'approved')}
                      >
                        Aprobar
                      </button>
                      <input
                        type="text"
                        placeholder="Nota rechazo (opcional)"
                        value={rejectNote[row.id] ?? ''}
                        onChange={(e) =>
                          setRejectNote((prev) => ({ ...prev, [row.id]: e.target.value }))
                        }
                        style={{ maxWidth: 140, fontSize: 12 }}
                      />
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => void patchStatus(row.id, 'rejected')}
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                  {row.status === 'approved' && (
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => void patchStatus(row.id, 'rejected')}
                    >
                      Rechazar
                    </button>
                  )}
                  {row.status === 'rejected' && (
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => void patchStatus(row.id, 'approved')}
                    >
                      Aprobar
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => void deleteReview(row.id)}
                  >
                    Eliminar
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
