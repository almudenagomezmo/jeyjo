import type { Payload } from 'payload'

import { createStubDocumentsReader } from '@jeyjo/erp-ports'

import { getSupabaseServerClient } from '@/lib/supabase-server'

import { dispatchNotification } from './dispatch'
import { findNewInvoiceIds } from './invoice-diff'

type CustomerRow = {
  id: string
  erp_code: string | null
}

export async function runInvoiceSync(payload: Payload): Promise<{
  customersProcessed: number
  notificationsCreated: number
}> {
  const supabase = getSupabaseServerClient()
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, erp_code')
    .not('erp_code', 'is', null)
    .not('validated_at', 'is', null)

  if (error) {
    throw new Error(`customers query failed: ${error.message}`)
  }

  const reader = createStubDocumentsReader()
  let customersProcessed = 0
  let notificationsCreated = 0

  for (const customer of (customers ?? []) as CustomerRow[]) {
    const erpCode = customer.erp_code?.trim()
    if (!erpCode) continue

    const invoices = await reader.listInvoicesByCustomer(erpCode)
    const currentIds = invoices.map((i) => i.id)

    const { data: state } = await supabase
      .from('erp_invoice_sync_state')
      .select('known_invoice_ids')
      .eq('customer_id', customer.id)
      .maybeSingle()

    const knownRaw = state?.known_invoice_ids
    const knownIds = Array.isArray(knownRaw)
      ? knownRaw.filter((x): x is string => typeof x === 'string')
      : []

    if (!state) {
      await supabase.from('erp_invoice_sync_state').upsert({
        customer_id: customer.id,
        known_invoice_ids: currentIds,
        last_synced_at: new Date().toISOString(),
      })
      customersProcessed += 1
      continue
    }

    const newInvoices = findNewInvoiceIds(knownIds, invoices)

    if (newInvoices.length > 0) {
      for (const inv of newInvoices) {
        const amountLabel = new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: inv.currency,
        }).format(inv.totalAmount)

        const result = await dispatchNotification(payload, {
          customerId: customer.id,
          type: 'invoice_new',
          title: 'Nueva factura disponible',
          body: `Factura ${inv.id} por ${amountLabel}`,
          payload: {
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber ?? inv.id,
            amount: inv.totalAmount,
            currency: inv.currency,
            href: `/cuenta/empresa/contabilidad/facturas?highlight=${encodeURIComponent(inv.id)}`,
          },
          idempotencyKey: `invoice:${customer.id}:${inv.id}`,
        })
        notificationsCreated += result.created
      }

    }

    await supabase.from('erp_invoice_sync_state').upsert({
      customer_id: customer.id,
      known_invoice_ids: currentIds,
      last_synced_at: new Date().toISOString(),
    })

    customersProcessed += 1
  }

  return { customersProcessed, notificationsCreated }
}
