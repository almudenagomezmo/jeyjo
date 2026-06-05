'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { CUSTOMER_GROUP_OPTIONS, customerGroupLabel } from '@/lib/customers/group-labels'

import './index.scss'

type CustomerRow = {
  id: string
  commercial_name: string
  email: string
  tax_id: string | null
  phone: string | null
  customer_group: number
  validated_at: string | null
  is_company: boolean
  created_at: string
}

type WebProfileRow = {
  id: string
  email: string
  role: string
  is_active: boolean
  last_login_at: string | null
  display_name: string | null
  email_confirmed: boolean
}

type CustomerDetail = {
  customer: CustomerRow & {
    legal_name: string | null
    erp_code: string | null
    billing_address_line1: string | null
    billing_city: string | null
    billing_postal_code: string | null
    billing_country: string | null
  }
  profiles: WebProfileRow[]
  canValidate: boolean
  emailConfirmedForValidation: boolean
}

const baseClass = 'customers-admin-view'

function readInitialStatus(): string {
  if (typeof window === 'undefined') return 'pending'
  const status = new URLSearchParams(window.location.search).get('status')
  return status === 'validated' || status === 'all' ? status : 'pending'
}

export const CustomersAdminView: React.FC = () => {
  const [rows, setRows] = useState<CustomerRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    status: readInitialStatus(),
    group: '',
    search: '',
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<CustomerDetail | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [validateOpen, setValidateOpen] = useState(false)
  const [validateGroup, setValidateGroup] = useState(1)
  const [busy, setBusy] = useState(false)

  const groupHint = useMemo(
    () => CUSTOMER_GROUP_OPTIONS.find((o) => o.value === validateGroup)?.hint ?? '',
    [validateGroup],
  )

  const load = useCallback(async () => {
    setError(null)
    const params = new URLSearchParams()
    params.set('status', filters.status || 'pending')
    if (filters.group) params.set('group', filters.group)
    if (filters.search.trim()) params.set('search', filters.search.trim())
    params.set('page', String(page))
    params.set('limit', '25')

    const res = await fetch(`/api/customers-admin?${params}`, { credentials: 'include' })
    if (!res.ok) {
      setError(res.status === 403 ? 'Acceso denegado' : 'Error al cargar clientes')
      return
    }
    const data = await res.json()
    setRows(data.docs ?? [])
    setTotal(data.totalDocs ?? 0)
  }, [filters, page])

  const loadDetail = useCallback(async (id: string) => {
    setDetailError(null)
    const res = await fetch(`/api/customers-admin/${id}`, { credentials: 'include' })
    if (!res.ok) {
      setDetail(null)
      setDetailError(res.status === 404 ? 'Cliente no encontrado' : 'Error al cargar ficha')
      return
    }
    const data = (await res.json()) as CustomerDetail
    setDetail(data)
    setValidateGroup(data.customer.customer_group === 1 ? 1 : 2)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId)
    else setDetail(null)
  }, [selectedId, loadDetail])

  const openValidate = () => {
    if (!detail) return
    setValidateGroup(detail.customer.is_company ? 2 : 1)
    setValidateOpen(true)
  }

  const runValidate = async () => {
    if (!detail) return
    setBusy(true)
    setError(null)
    const res = await fetch(`/next/customers/${detail.customer.id}/validate`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerGroup: validateGroup }),
    })
    setBusy(false)
    if (!res.ok) {
      const text = await res.text()
      setError(text || 'No se pudo validar')
      return
    }
    setValidateOpen(false)
    setSelectedId(null)
    void load()
  }

  const totalPages = Math.max(1, Math.ceil(total / 25))

  return (
    <div className={baseClass}>
      <h1>Clientes tienda</h1>
      <p className={`${baseClass}__hint`}>
        Cuentas registradas en el storefront (Supabase). Valida y asigna grupo ERP 01–04 (RF-004).
      </p>

      <div className={`${baseClass}__filters`}>
        <select
          value={filters.status}
          onChange={(e) => {
            setPage(1)
            setFilters((f) => ({ ...f, status: e.target.value }))
          }}
        >
          <option value="pending">Pendientes</option>
          <option value="validated">Validados</option>
          <option value="all">Todos</option>
        </select>
        <select
          value={filters.group}
          onChange={(e) => {
            setPage(1)
            setFilters((f) => ({ ...f, group: e.target.value }))
          }}
        >
          <option value="">Todos los grupos</option>
          {CUSTOMER_GROUP_OPTIONS.map((o) => (
            <option key={o.value} value={String(o.value)}>
              {o.label}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Buscar email, CIF o nombre"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
        <button type="button" onClick={() => void load()}>
          Filtrar
        </button>
      </div>

      {error ? <p className={`${baseClass}__error`}>{error}</p> : null}

      <p>
        {total} cliente{total === 1 ? '' : 's'}
      </p>

      <div className={`${baseClass}__layout`}>
        <table className={`${baseClass}__table`}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>CIF</th>
              <th>Grupo</th>
              <th>Estado</th>
              <th>Alta</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className={selectedId === row.id ? `${baseClass}__row--active` : undefined}
                onClick={() => setSelectedId(row.id)}
              >
                <td>{row.commercial_name}</td>
                <td>{row.email}</td>
                <td>{row.tax_id ?? '—'}</td>
                <td>{customerGroupLabel(row.customer_group)}</td>
                <td>{row.validated_at ? 'Validado' : 'Pendiente'}</td>
                <td>{new Date(row.created_at).toLocaleString('es-ES')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {detail ? (
          <aside className={`${baseClass}__detail`}>
            <h2>{detail.customer.commercial_name}</h2>
            {detailError ? <p className={`${baseClass}__error`}>{detailError}</p> : null}
            <dl className={`${baseClass}__meta`}>
              <dt>Email</dt>
              <dd>{detail.customer.email}</dd>
              <dt>CIF/NIF</dt>
              <dd>{detail.customer.tax_id ?? '—'}</dd>
              <dt>Teléfono</dt>
              <dd>{detail.customer.phone ?? '—'}</dd>
              <dt>Grupo</dt>
              <dd>{customerGroupLabel(detail.customer.customer_group)}</dd>
              <dt>Validación</dt>
              <dd>
                {detail.customer.validated_at ?
                  new Date(detail.customer.validated_at).toLocaleString('es-ES')
                : 'Pendiente'}
              </dd>
              <dt>Dirección facturación</dt>
              <dd>
                {[detail.customer.billing_address_line1, detail.customer.billing_postal_code, detail.customer.billing_city]
                  .filter(Boolean)
                  .join(', ') || '—'}
              </dd>
              <dt>ERP</dt>
              <dd>{detail.customer.erp_code ?? '—'}</dd>
            </dl>

            <h3>Perfiles web</h3>
            <ul className={`${baseClass}__profiles`}>
              {detail.profiles.map((p) => (
                <li key={p.id}>
                  <strong>{p.email}</strong> — {p.role}
                  {p.email_confirmed ?
                    <span className={`${baseClass}__badge ${baseClass}__badge--ok`}>Email confirmado</span>
                  : <span className={`${baseClass}__badge ${baseClass}__badge--warn`}>Email sin confirmar</span>}
                  {p.last_login_at ?
                    <span> · Último acceso {new Date(p.last_login_at).toLocaleString('es-ES')}</span>
                  : null}
                </li>
              ))}
            </ul>

            {detail.canValidate ?
              <button
                type="button"
                className={`${baseClass}__validate-btn`}
                disabled={!detail.emailConfirmedForValidation || busy}
                onClick={openValidate}
              >
                Validar cuenta
              </button>
            : null}
            {detail.canValidate && !detail.emailConfirmedForValidation ?
              <p className={`${baseClass}__warn`}>
                El cliente debe confirmar su email (correo Supabase) antes de validar.
              </p>
            : null}
          </aside>
        ) : null}
      </div>

      {rows.length === 0 && !error ? <p>No hay clientes con estos filtros.</p> : null}

      <div className={`${baseClass}__pager`}>
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Anterior
        </button>
        <span>
          Página {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Siguiente
        </button>
      </div>

      {validateOpen && detail ?
        <div className={`${baseClass}__modal-backdrop`} role="presentation">
          <div className={`${baseClass}__modal`} role="dialog" aria-labelledby="validate-title">
            <h2 id="validate-title">Validar {detail.customer.commercial_name}</h2>
            <label htmlFor="validate-group">Grupo de cliente</label>
            <select
              id="validate-group"
              value={validateGroup}
              onChange={(e) => setValidateGroup(Number(e.target.value))}
            >
              {CUSTOMER_GROUP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className={`${baseClass}__hint`}>{groupHint}</p>
            <div className={`${baseClass}__modal-actions`}>
              <button type="button" onClick={() => setValidateOpen(false)} disabled={busy}>
                Cancelar
              </button>
              <button type="button" onClick={() => void runValidate()} disabled={busy}>
                Confirmar validación
              </button>
            </div>
          </div>
        </div>
      : null}
    </div>
  )
}
