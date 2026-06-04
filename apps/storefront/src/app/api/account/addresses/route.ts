import { NextResponse } from 'next/server'

import type { CustomerAddressInsert } from '@jeyjo/database-types'

import { getCustomerContext } from '@/lib/auth/customer-context'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const MAX_ADDRESSES = 20

export async function GET() {
  const ctx = await getCustomerContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('customer_addresses')
    .select('*')
    .eq('customer_id', ctx.customerId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ addresses: data ?? [] })
}

export async function POST(request: Request) {
  const ctx = await getCustomerContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Partial<CustomerAddressInsert>
  try {
    body = (await request.json()) as Partial<CustomerAddressInsert>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const address_line1 = body.address_line1?.trim()
  const city = body.city?.trim()
  const postal_code = body.postal_code?.trim()
  if (!address_line1 || !city || !postal_code) {
    return NextResponse.json({ error: 'address_line1, city and postal_code are required' }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()

  const { count } = await supabase
    .from('customer_addresses')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', ctx.customerId)

  if ((count ?? 0) >= MAX_ADDRESSES) {
    return NextResponse.json({ error: 'Maximum addresses reached' }, { status: 400 })
  }

  const row: CustomerAddressInsert = {
    customer_id: ctx.customerId,
    label: body.label?.trim() || null,
    recipient_name: body.recipient_name?.trim() || null,
    address_line1,
    address_line2: body.address_line2?.trim() || null,
    city,
    postal_code,
    country: (body.country?.trim() || 'ES').slice(0, 2),
    phone: body.phone?.trim() || null,
    is_default: Boolean(body.is_default),
  }

  const { data, error } = await supabase.from('customer_addresses').insert(row).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ address: data }, { status: 201 })
}

export async function DELETE(request: Request) {
  const ctx = await getCustomerContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')?.trim()
  if (!id) {
    return NextResponse.json({ error: 'id query param is required' }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('customer_addresses')
    .delete()
    .eq('id', id)
    .eq('customer_id', ctx.customerId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
