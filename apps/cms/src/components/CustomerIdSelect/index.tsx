'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { FieldDescription, FieldLabel, useField } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'

import { customerGroupLabel } from '@/lib/customers/group-labels'

import './index.scss'

type CustomerOption = {
  id: string
  commercial_name: string
  email: string
  tax_id: string | null
  customer_group: number
  is_company: boolean
}

const baseClass = 'customer-id-select'

function formatCustomerLabel(customer: CustomerOption): string {
  const name = customer.commercial_name?.trim() || customer.email
  const tax = customer.tax_id?.trim()
  const group = customerGroupLabel(customer.customer_group)
  return tax ? `${name} — ${tax} (${group})` : `${name} — ${group}`
}

async function fetchCustomers(search: string): Promise<CustomerOption[]> {
  const params = new URLSearchParams({
    status: 'validated',
    limit: '25',
    page: '1',
  })
  if (search.trim()) params.set('search', search.trim())

  const res = await fetch(`/api/customers-admin?${params}`, { credentials: 'include' })
  if (!res.ok) return []

  const json = (await res.json()) as { docs?: CustomerOption[] }
  return (json.docs ?? []).filter((row) => row.customer_group !== 1)
}

async function fetchCustomerById(id: string): Promise<CustomerOption | null> {
  const res = await fetch(`/api/customers-admin/${id}`, { credentials: 'include' })
  if (!res.ok) return null

  const json = (await res.json()) as { customer?: CustomerOption }
  return json.customer ?? null
}

export const CustomerIdSelectField: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue } = useField<string>({ path })
  const [search, setSearch] = useState('')
  const [options, setOptions] = useState<CustomerOption[]>([])
  const [selected, setSelected] = useState<CustomerOption | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const selectedId = typeof value === 'string' ? value.trim() : ''

  useEffect(() => {
    if (!selectedId) {
      setSelected(null)
      return
    }

    let cancelled = false
    void fetchCustomerById(selectedId).then((customer) => {
      if (!cancelled) setSelected(customer)
    })

    return () => {
      cancelled = true
    }
  }, [selectedId])

  useEffect(() => {
    if (!open) return

    let cancelled = false
    const timer = window.setTimeout(() => {
      setLoading(true)
      void fetchCustomers(search)
        .then((rows) => {
          if (!cancelled) setOptions(rows)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [open, search])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const handleSelect = useCallback(
    (customer: CustomerOption) => {
      setValue(customer.id)
      setSelected(customer)
      setSearch('')
      setOpen(false)
    },
    [setValue],
  )

  const handleClear = useCallback(() => {
    setValue('')
    setSelected(null)
    setSearch('')
    setOptions([])
  }, [setValue])

  const placeholder = useMemo(
    () => (selected ? formatCustomerLabel(selected) : 'Buscar cliente por nombre, email o CIF…'),
    [selected],
  )

  return (
    <div className={baseClass} ref={rootRef}>
      <FieldLabel htmlFor={`field-${path}`} label={field.label} required={field.required} />
      {field.admin?.description ? (
        <FieldDescription description={field.admin.description} path={path} />
      ) : null}

      {selected ? (
        <div className={`${baseClass}__selected`}>
          <div className={`${baseClass}__selected-label`}>{formatCustomerLabel(selected)}</div>
          <button
            className={`${baseClass}__clear`}
            onClick={handleClear}
            type="button"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <>
          <input
            className={`${baseClass}__search`}
            id={`field-${path}`}
            onChange={(event) => {
              setSearch(event.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            type="search"
            value={search}
          />
          {open ? (
            <div className={`${baseClass}__dropdown`} role="listbox">
              {loading ? (
                <div className={`${baseClass}__empty`}>Buscando clientes…</div>
              ) : options.length === 0 ? (
                <div className={`${baseClass}__empty`}>
                  {search.trim()
                    ? 'No hay clientes B2B validados con ese criterio.'
                    : 'Escribe para buscar clientes B2B validados.'}
                </div>
              ) : (
                options.map((customer) => (
                  <button
                    className={`${baseClass}__option`}
                    key={customer.id}
                    onClick={() => handleSelect(customer)}
                    type="button"
                  >
                    <span className={`${baseClass}__option-name`}>
                      {customer.commercial_name || customer.email}
                    </span>
                    <span className={`${baseClass}__option-meta`}>
                      {customer.email}
                      {customer.tax_id ? ` · ${customer.tax_id}` : ''}
                      {` · ${customerGroupLabel(customer.customer_group)}`}
                    </span>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

type CustomerIdSelectCellProps = {
  cellData?: string | null
}

export const CustomerIdSelectCell = ({ cellData }: CustomerIdSelectCellProps) => {
  const customerId = typeof cellData === 'string' ? cellData.trim() : ''
  const [label, setLabel] = useState(customerId)

  useEffect(() => {
    if (!customerId) {
      setLabel('—')
      return
    }

    let cancelled = false
    void fetchCustomerById(customerId).then((customer) => {
      if (cancelled) return
      setLabel(customer ? formatCustomerLabel(customer) : customerId)
    })

    return () => {
      cancelled = true
    }
  }, [customerId])

  return <span className={`${baseClass}__cell`}>{label}</span>
}
