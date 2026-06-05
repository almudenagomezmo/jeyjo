'use client'

import { Link, NavGroup, useAuth, useConfig } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'
import { formatAdminURL } from 'payload/shared'
import React, { Fragment } from 'react'

import { canValidateCustomers } from '@/access/customerValidation'

const navBaseClass = 'nav'

export const CustomersAdminNavLink: React.FC = () => {
  const { user } = useAuth()
  const pathname = usePathname()
  const { config } = useConfig()

  if (!canValidateCustomers(user)) {
    return null
  }

  const href = formatAdminURL({
    adminRoute: config.routes.admin,
    path: '/customers',
  })
  const isActive =
    pathname.startsWith(href) && ['/', undefined].includes(pathname[href.length] as '/' | undefined)

  const label = (
    <Fragment>
      {isActive ? <div className={`${navBaseClass}__link-indicator`} /> : null}
      <span className={`${navBaseClass}__link-label`}>Clientes tienda</span>
    </Fragment>
  )

  return (
    <NavGroup label="Clientes" isOpen>
      {pathname === href ?
        <div className={`${navBaseClass}__link`} id="nav-customers-admin">
          {label}
        </div>
      : <Link className={`${navBaseClass}__link`} href={href} id="nav-customers-admin" prefetch={false}>
          {label}
        </Link>
      }
    </NavGroup>
  )
}
