import { NextResponse } from 'next/server'

import type { Database } from '@jeyjo/database-types'

import { requireB2bApiSession } from '@/lib/intranet/b2b-api-guard'
import type { NotificationPreferences } from '@/lib/notifications/types'
import { createSupabaseServerClient } from '@/lib/supabase/server'

type Channel = Database['public']['Enums']['notification_channel']

function mapPrefs(row: {
  invoice_channel: Channel
  order_channel: Channel
  quote_channel: Channel
  email_disabled_at: string | null
}): NotificationPreferences {
  return {
    invoiceChannel: row.invoice_channel,
    orderChannel: row.order_channel,
    quoteChannel: row.quote_channel,
    emailDisabledAt: row.email_disabled_at,
  }
}

const DEFAULT_PREFS: NotificationPreferences = {
  invoiceChannel: 'email',
  orderChannel: 'email',
  quoteChannel: 'email',
  emailDisabledAt: null,
}

function parseChannel(value: unknown): Channel | null {
  if (value === 'email' || value === 'portal' || value === 'off') return value
  return null
}

export async function GET() {
  const guard = await requireB2bApiSession()
  if ('error' in guard) return guard.error

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('invoice_channel, order_channel, quote_channel, email_disabled_at')
    .eq('web_profile_id', guard.ctx.userId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json(DEFAULT_PREFS)
  return NextResponse.json(mapPrefs(data))
}

export async function PATCH(request: Request) {
  const guard = await requireB2bApiSession()
  if ('error' in guard) return guard.error

  const body = (await request.json()) as {
    invoiceChannel?: unknown
    orderChannel?: unknown
    quoteChannel?: unknown
  }

  const patch: Partial<{
    invoice_channel: Channel
    order_channel: Channel
    quote_channel: Channel
  }> = {}

  const invoice = parseChannel(body.invoiceChannel)
  const order = parseChannel(body.orderChannel)
  const quote = parseChannel(body.quoteChannel)
  if (body.invoiceChannel !== undefined && !invoice) {
    return NextResponse.json({ error: 'Invalid invoiceChannel' }, { status: 400 })
  }
  if (body.orderChannel !== undefined && !order) {
    return NextResponse.json({ error: 'Invalid orderChannel' }, { status: 400 })
  }
  if (body.quoteChannel !== undefined && !quote) {
    return NextResponse.json({ error: 'Invalid quoteChannel' }, { status: 400 })
  }
  if (invoice) patch.invoice_channel = invoice
  if (order) patch.order_channel = order
  if (quote) patch.quote_channel = quote

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()
  const { data: existing } = await supabase
    .from('notification_preferences')
    .select('web_profile_id')
    .eq('web_profile_id', guard.ctx.userId)
    .maybeSingle()

  const write = existing
    ? supabase
        .from('notification_preferences')
        .update(patch)
        .eq('web_profile_id', guard.ctx.userId)
    : supabase.from('notification_preferences').insert({
        web_profile_id: guard.ctx.userId,
        invoice_channel: invoice ?? 'email',
        order_channel: order ?? 'email',
        quote_channel: quote ?? 'email',
      })

  const { data, error } = await write
    .select('invoice_channel, order_channel, quote_channel, email_disabled_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(mapPrefs(data))
}
