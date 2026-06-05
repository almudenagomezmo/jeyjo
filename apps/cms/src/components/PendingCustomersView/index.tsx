import { redirect } from 'next/navigation'

/** Redirect legacy admin path to Customers admin with pending filter. */
export function PendingCustomersView() {
  redirect('/admin/customers?status=pending')
}
