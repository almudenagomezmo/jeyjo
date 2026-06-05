'use client'

import React, { useEffect } from 'react'

/** Redirect legacy admin path to Customers admin with pending filter. */
export const PendingCustomersView: React.FC = () => {
  useEffect(() => {
    window.location.replace('/admin/customers?status=pending')
  }, [])

  return <p>Redirigiendo a Clientes tienda…</p>
}
