'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import { useAuth } from '@payloadcms/ui'

import {
  CUSTOMER_GROUP_OPTIONS,
  customerGroupLabel,
  roleForCustomerGroup,
} from '@/lib/customers/group-labels'
import { reclassifyImpactCopy } from '@/lib/customers/reclassify-validation'

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
  canReclassify: boolean
  emailConfirmedForValidation: boolean
}

const PROFILE_ROLE_OPTIONS = [
  { value: 'b2c', label: 'B2C (particular)' },
  { value: 'b2b_superadmin', label: 'B2B superadmin (titular)' },
  { value: 'b2b_subuser', label: 'B2B subusuario' },
] as const

const baseClass = 'customers-admin-view'

const STATUS_TABS = [
  { value: 'pending', label: 'Pendientes' },
  { value: 'validated', label: 'Validados' },
  { value: 'all', label: 'Todos' },
] as const

function readInitialStatus(): string {
  if (typeof window === 'undefined') return 'pending'
  const status = new URLSearchParams(window.location.search).get('status')
  return status === 'validated' || status === 'all' ? status : 'pending'
}

function defaultRoleForProfile(profile: WebProfileRow, customerGroup: number): string {
  if (customerGroup === 1) return 'b2c'
  if (profile.role === 'b2b_subuser') return 'b2b_subuser'
  return 'b2b_superadmin'
}

function buildProfileRoles(profiles: WebProfileRow[], customerGroup: number): Record<string, string> {
  return Object.fromEntries(
    profiles.map((p) => [p.id, defaultRoleForProfile(p, customerGroup)]),
  )
}

export const CustomersAdminClient: React.FC = () => {
  const { user } = useAuth()
  const [mfaReady, setMfaReady] = useState(false)
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
  const [reclassifyOpen, setReclassifyOpen] = useState(false)
  const [validateGroup, setValidateGroup] = useState(1)
  const [reclassifyGroup, setReclassifyGroup] = useState(1)
  const [profileRoles, setProfileRoles] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

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

  const groupHint = useMemo(
    () => CUSTOMER_GROUP_OPTIONS.find((o) => o.value === validateGroup)?.hint ?? '',
    [validateGroup],
  )

  const reclassifyHint = useMemo(
    () => CUSTOMER_GROUP_OPTIONS.find((o) => o.value === reclassifyGroup)?.hint ?? '',
    [reclassifyGroup],
  )

  const reclassifyImpact = useMemo(() => reclassifyImpactCopy(reclassifyGroup), [reclassifyGroup])

  const suggestedTitularRole = useMemo(
    () => roleForCustomerGroup(reclassifyGroup),
    [reclassifyGroup],
  )

  const load = useCallback(async () => {
    setError(null)
    setLoading(true)
    const params = new URLSearchParams()
    params.set('status', filters.status || 'pending')
    if (filters.group) params.set('group', filters.group)
    if (filters.search.trim()) params.set('search', filters.search.trim())
    params.set('page', String(page))
    params.set('limit', '25')

    try {
      const res = await fetch(`/api/customers-admin?${params}`, { credentials: 'include' })
      if (!res.ok) {
        setError(
          res.status === 403
            ? 'Completa la verificación MFA para acceder a clientes tienda.'
            : 'Error al cargar clientes',
        )
        setRows([])
        setTotal(0)
        return
      }
      const data = await res.json()
      setRows(data.docs ?? [])
      setTotal(data.totalDocs ?? 0)
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  const loadDetail = useCallback(async (id: string): Promise<CustomerDetail | null> => {
    setDetailLoading(true)
    setDetailError(null)
    try {
      const res = await fetch(`/api/customers-admin/${id}`, { credentials: 'include' })
      if (!res.ok) {
        setDetail(null)
        setDetailError(res.status === 404 ? 'Cliente no encontrado' : 'Error al cargar ficha')
        return null
      }
      const data = (await res.json()) as CustomerDetail
      setDetail(data)
      setValidateGroup(data.customer.customer_group === 1 ? 1 : 2)
      setReclassifyGroup(data.customer.customer_group)
      setProfileRoles(
        Object.fromEntries(data.profiles.map((p) => [p.id, p.role])),
      )
      return data
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    void checkMfa()
  }, [checkMfa])

  useEffect(() => {
    if (!mfaReady) return
    void load()
  }, [mfaReady, load])

  const selectCustomer = useCallback(
    (id: string | null) => {
      setSelectedId(id)
      if (!id) {
        setDetail(null)
        setDetailError(null)
        return
      }
      void loadDetail(id)
    },
    [loadDetail],
  )

  const openValidateModal = useCallback((customerDetail: CustomerDetail) => {
    setValidateGroup(customerDetail.customer.is_company ? 2 : 1)
    setValidateOpen(true)
  }, [])

  const openReclassifyModal = useCallback((customerDetail: CustomerDetail) => {
    setReclassifyGroup(customerDetail.customer.customer_group)
    setProfileRoles(
      buildProfileRoles(customerDetail.profiles, customerDetail.customer.customer_group),
    )
    setReclassifyOpen(true)
  }, [])

  const openCustomerAction = useCallback(
    async (id: string, action: 'validate' | 'reclassify') => {
      setError(null)
      setSelectedId(id)
      const customerDetail = await loadDetail(id)
      if (!customerDetail) return

      if (action === 'validate') {
        if (!customerDetail.canValidate) {
          if (!customerDetail.emailConfirmedForValidation) {
            setError('El cliente debe confirmar su email antes de validar.')
          }
          return
        }
        openValidateModal(customerDetail)
        return
      }

      if (action === 'reclassify') {
        if (!customerDetail.customer.validated_at) {
          setError('Cliente pendiente: usa Validar para asignar grupo y activar la cuenta.')
          return
        }
        openReclassifyModal(customerDetail)
      }
    },
    [loadDetail, openReclassifyModal, openValidateModal],
  )

  const handleViewCustomer = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    selectCustomer(id)
  }

  const handleValidateCustomer = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    void openCustomerAction(id, 'validate')
  }

  const handleReclassifyCustomer = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    void openCustomerAction(id, 'reclassify')
  }

  const onReclassifyGroupChange = (group: number) => {
    setReclassifyGroup(group)
    if (!detail) return
    setProfileRoles(buildProfileRoles(detail.profiles, group))
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
    selectCustomer(null)
    void load()
  }

  const runReclassify = async () => {
    if (!detail) return
    setBusy(true)
    setError(null)
    const res = await fetch(`/next/customers/${detail.customer.id}/reclassify`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerGroup: reclassifyGroup,
        profileRoles: detail.profiles.map((p) => ({
          profileId: p.id,
          role: profileRoles[p.id] ?? p.role,
        })),
      }),
    })
    setBusy(false)
    if (!res.ok) {
      const text = await res.text()
      setError(text || 'No se pudo reclasificar')
      return
    }
    setReclassifyOpen(false)
    void loadDetail(detail.customer.id)
    void load()
  }

  const totalPages = Math.max(1, Math.ceil(total / 25))

  if (isStaffUser && !mfaReady) {
    return null
  }

  const validateModal =
    mounted && validateOpen && detail ?
      createPortal(
        <div className={`${baseClass}__modal-backdrop`} role="presentation">
          <div className={`${baseClass}__modal`} role="dialog" aria-labelledby="validate-title">
            <div className={`${baseClass}__modal-header`}>
              <h2 id="validate-title">Validar {detail.customer.commercial_name}</h2>
            </div>
            <div className={`${baseClass}__modal-body`}>
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
            </div>
            <div className={`${baseClass}__modal-actions`}>
              <button
                type="button"
                className={`${baseClass}__btn`}
                onClick={() => setValidateOpen(false)}
                disabled={busy}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={`${baseClass}__btn ${baseClass}__btn--primary`}
                onClick={() => void runValidate()}
                disabled={busy}
              >
                Confirmar validación
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null

  const reclassifyModal =
    mounted && reclassifyOpen && detail ?
      createPortal(
        <div className={`${baseClass}__modal-backdrop`} role="presentation">
          <div
            className={`${baseClass}__modal ${baseClass}__modal--wide`}
            role="dialog"
            aria-labelledby="reclassify-title"
          >
            <div className={`${baseClass}__modal-header`}>
              <h2 id="reclassify-title">Reclasificar {detail.customer.commercial_name}</h2>
            </div>
            <div className={`${baseClass}__modal-body`}>
              <label htmlFor="reclassify-group">Grupo de cliente</label>
              <select
                id="reclassify-group"
                value={reclassifyGroup}
                onChange={(e) => onReclassifyGroupChange(Number(e.target.value))}
              >
                {CUSTOMER_GROUP_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p className={`${baseClass}__hint`}>{reclassifyHint}</p>
              <p className={`${baseClass}__impact`}>{reclassifyImpact}</p>

              <h3 className={`${baseClass}__modal-subtitle`}>Roles por perfil</h3>
              {detail.profiles.length === 0 ?
                <p className={`${baseClass}__hint`}>
                  Este cliente no tiene perfiles web vinculados. Solo se actualizará el grupo ERP
                  del registro en Supabase.
                </p>
              : <ul className={`${baseClass}__profile-roles`}>
                  {detail.profiles.map((p) => (
                    <li key={p.id}>
                      <span>{p.email}</span>
                      <select
                        value={profileRoles[p.id] ?? p.role}
                        onChange={(e) =>
                          setProfileRoles((prev) => ({ ...prev, [p.id]: e.target.value }))
                        }
                      >
                        {PROFILE_ROLE_OPTIONS.filter((opt) => {
                          if (reclassifyGroup === 1) return opt.value === 'b2c'
                          if (opt.value === 'b2c') return false
                          return true
                        }).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </li>
                  ))}
                </ul>
              }
              {reclassifyGroup >= 2 ?
                <p className={`${baseClass}__hint`}>
                  Rol sugerido para titular: <strong>{suggestedTitularRole}</strong>
                </p>
              : null}
            </div>
            <div className={`${baseClass}__modal-actions`}>
              <button
                type="button"
                className={`${baseClass}__btn`}
                onClick={() => setReclassifyOpen(false)}
                disabled={busy}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={`${baseClass}__btn ${baseClass}__btn--primary`}
                onClick={() => void runReclassify()}
                disabled={busy}
              >
                Confirmar reclasificación
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <div className={baseClass}>
      <header className={`${baseClass}__header`}>
        <h1>Clientes tienda</h1>
        <p className={`${baseClass}__hint`}>
          Cuentas registradas en el storefront (Supabase). Valida y asigna grupo ERP 01–04 (RF-004).
        </p>
      </header>

      <div className={`${baseClass}__status-tabs`} role="tablist" aria-label="Estado de clientes">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={filters.status === tab.value}
            className={`${baseClass}__status-tab${
              filters.status === tab.value ? ` ${baseClass}__status-tab--active` : ''
            }`}
            onClick={() => {
              setPage(1)
              setFilters((f) => ({ ...f, status: tab.value }))
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={`${baseClass}__toolbar`}>
        <label>
          Grupo
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
        </label>
        <label>
          Buscar
          <input
            type="search"
            placeholder="Email, CIF o nombre"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void load()
            }}
          />
        </label>
        <button
          type="button"
          className={`${baseClass}__btn ${baseClass}__btn--primary`}
          onClick={() => void load()}
        >
          Filtrar
        </button>
      </div>

      {error ?
        <div className={`${baseClass}__alert ${baseClass}__alert--error`} role="alert">
          {error}
        </div>
      : null}

      <div className={`${baseClass}__summary`}>
        <span>
          {total} cliente{total === 1 ? '' : 's'}
        </span>
      </div>

      <div className={`${baseClass}__layout`}>
        <section className={`${baseClass}__panel`}>
          {loading ?
            <p className={`${baseClass}__loading`}>Cargando clientes…</p>
          : rows.length === 0 && !error ?
            <p className={`${baseClass}__empty`}>No hay clientes con estos filtros.</p>
          : <>
              <div className={`${baseClass}__table-wrap`}>
                <table className={`${baseClass}__table`}>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>CIF</th>
                      <th>Grupo</th>
                      <th>Estado</th>
                      <th>Alta</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.id}
                        className={
                          selectedId === row.id ? `${baseClass}__row--active` : undefined
                        }
                        onClick={() => selectCustomer(row.id)}
                      >
                        <td>{row.commercial_name}</td>
                        <td>{row.email}</td>
                        <td>{row.tax_id ?? '—'}</td>
                        <td>{customerGroupLabel(row.customer_group)}</td>
                        <td>
                          <span
                            className={`${baseClass}__status-badge ${
                              row.validated_at
                                ? `${baseClass}__status-badge--validated`
                                : `${baseClass}__status-badge--pending`
                            }`}
                          >
                            {row.validated_at ? 'Validado' : 'Pendiente'}
                          </span>
                        </td>
                        <td>{new Date(row.created_at).toLocaleString('es-ES')}</td>
                        <td>
                          <div
                            className={`${baseClass}__row-actions`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              className={`${baseClass}__btn ${baseClass}__btn--sm`}
                              onClick={(e) => handleViewCustomer(e, row.id)}
                            >
                              Ver ficha
                            </button>
                            {!row.validated_at ?
                              <button
                                type="button"
                                className={`${baseClass}__btn ${baseClass}__btn--sm ${baseClass}__btn--primary`}
                                disabled={busy || detailLoading}
                                onClick={(e) => handleValidateCustomer(e, row.id)}
                              >
                                Validar
                              </button>
                            : <button
                                type="button"
                                className={`${baseClass}__btn ${baseClass}__btn--sm`}
                                disabled={busy || detailLoading}
                                onClick={(e) => handleReclassifyCustomer(e, row.id)}
                              >
                                Reclasificar
                              </button>
                            }
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={`${baseClass}__pager`}>
                <button
                  type="button"
                  className={`${baseClass}__btn`}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </button>
                <span>
                  Página {page} / {totalPages}
                </span>
                <button
                  type="button"
                  className={`${baseClass}__btn`}
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </button>
              </div>
            </>
          }
        </section>

        <aside
          className={`${baseClass}__detail-panel${
            !detail && !selectedId ? ` ${baseClass}__detail-panel--empty` : ''
          }`}
        >
          {!selectedId ?
            <div className={`${baseClass}__detail-placeholder`}>
              <h2>Ficha del cliente</h2>
              <p>
                Selecciona un cliente de la tabla o usa <strong>Ver ficha</strong> para consultar
                datos y ejecutar <strong>Validar</strong> o <strong>Reclasificar</strong>.
              </p>
            </div>
          : detailLoading ?
            <div className={`${baseClass}__detail-placeholder`}>
              <p>Cargando ficha…</p>
            </div>
          : detail ?
            <>
              <div className={`${baseClass}__detail-header`}>
                <h2>{detail.customer.commercial_name}</h2>
                <button
                  type="button"
                  className={`${baseClass}__btn ${baseClass}__btn--ghost`}
                  aria-label="Cerrar ficha"
                  onClick={() => selectCustomer(null)}
                >
                  ✕
                </button>
              </div>

              <div className={`${baseClass}__detail-body`}>
                {detailError ?
                  <div className={`${baseClass}__alert ${baseClass}__alert--error`}>
                    {detailError}
                  </div>
                : null}

                <h3 className={`${baseClass}__section-title`}>Datos fiscales</h3>
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
                    {[
                      detail.customer.billing_address_line1,
                      detail.customer.billing_postal_code,
                      detail.customer.billing_city,
                    ]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </dd>
                  <dt>ERP</dt>
                  <dd>{detail.customer.erp_code ?? '—'}</dd>
                </dl>

                <h3 className={`${baseClass}__section-title`}>Perfiles web</h3>
                <ul className={`${baseClass}__profiles`}>
                  {detail.profiles.map((p) => (
                    <li key={p.id} className={`${baseClass}__profile-card`}>
                      <span className={`${baseClass}__profile-email`}>{p.email}</span>
                      <span className={`${baseClass}__profile-meta`}>
                        {p.role}
                        {p.email_confirmed ?
                          <span className={`${baseClass}__badge ${baseClass}__badge--ok`}>
                            Email confirmado
                          </span>
                        : <span className={`${baseClass}__badge ${baseClass}__badge--warn`}>
                            Email sin confirmar
                          </span>
                        }
                        {p.last_login_at ?
                          <span>
                            {' '}
                            · Último acceso {new Date(p.last_login_at).toLocaleString('es-ES')}
                          </span>
                        : null}
                      </span>
                    </li>
                  ))}
                </ul>

                {detail.canValidate && !detail.emailConfirmedForValidation ?
                  <div className={`${baseClass}__alert ${baseClass}__alert--warn`}>
                    El cliente debe confirmar su email (correo Supabase) antes de validar.
                  </div>
                : null}
              </div>

              <div className={`${baseClass}__detail-actions`}>
                {detail.canValidate ?
                  <button
                    type="button"
                    className={`${baseClass}__btn ${baseClass}__btn--primary`}
                    disabled={!detail.emailConfirmedForValidation || busy}
                    onClick={() => detail && openValidateModal(detail)}
                  >
                    Validar cuenta
                  </button>
                : null}
                {detail.customer.validated_at ?
                  <button
                    type="button"
                    className={`${baseClass}__btn`}
                    disabled={busy}
                    onClick={() => detail && openReclassifyModal(detail)}
                  >
                    Reclasificar
                  </button>
                : null}
              </div>
            </>
          : detailError ?
            <div className={`${baseClass}__detail-placeholder`}>
              <div className={`${baseClass}__alert ${baseClass}__alert--error`}>{detailError}</div>
              <button
                type="button"
                className={`${baseClass}__btn`}
                onClick={() => setSelectedId(null)}
              >
                Cerrar
              </button>
            </div>
          : null}
        </aside>
      </div>

      {validateModal}
      {reclassifyModal}
    </div>
  )
}
