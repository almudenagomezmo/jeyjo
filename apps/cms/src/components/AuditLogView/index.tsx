'use client'

import React, { useCallback, useEffect, useState } from 'react'

import './index.scss'

type AuditRow = {
  id: string
  created_at: string
  actor_name: string | null
  action: string
  entity_type: string
  entity_id: string | null
  source_ip: string | null
  previous_value: unknown
  new_value: unknown
}

const baseClass = 'audit-log-view'

export const AuditLogView: React.FC = () => {
  const [rows, setRows] = useState<AuditRow[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    actor: '',
    entityType: '',
    action: '',
    from: '',
    to: '',
  })

  const load = useCallback(async () => {
    setError(null)
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    params.set('limit', '50')

    const res = await fetch(`/api/audit-log?${params}`, { credentials: 'include' })
    if (!res.ok) {
      setError(res.status === 403 ? 'Acceso denegado' : 'Error al cargar auditoría')
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
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    params.set('export', 'true')
    const res = await fetch(`/api/audit-log?${params}`, { credentials: 'include' })
    if (!res.ok) {
      setError('Exportación no permitida')
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'audit-log.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={baseClass}>
      <h1>Consola de auditoría</h1>
      <div className={`${baseClass}__filters`}>
        <input
          placeholder="Operador (email)"
          value={filters.actor}
          onChange={(e) => setFilters({ ...filters, actor: e.target.value })}
        />
        <input
          placeholder="Tipo entidad"
          value={filters.entityType}
          onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
        />
        <input
          placeholder="Acción"
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
        />
        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters({ ...filters, from: e.target.value })}
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters({ ...filters, to: e.target.value })}
        />
        <button type="button" onClick={() => void load()}>
          Filtrar
        </button>
        <button type="button" onClick={() => void exportCsv()}>
          Export CSV
        </button>
      </div>
      {error && <p className={`${baseClass}__error`}>{error}</p>}
      <p>{total} registros</p>
      <table className={`${baseClass}__table`}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Operador</th>
            <th>Acción</th>
            <th>Entidad</th>
            <th>IP</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{new Date(row.created_at).toLocaleString()}</td>
              <td>{row.actor_name}</td>
              <td>{row.action}</td>
              <td>
                {row.entity_type} {row.entity_id ? `(${row.entity_id.slice(0, 8)}…)` : ''}
              </td>
              <td>{row.source_ip ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
