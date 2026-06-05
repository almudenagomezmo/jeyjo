import { APIError, type Endpoint } from 'payload'

import { hasStaffRole } from '@/access/staffRoles'
import { manualEspResync, resendNewsletterConfirmation } from '@/lib/newsletter/admin-actions'
import { listSubscribers, listSubscribersForExport } from '@/lib/newsletter/repository'
import { sendNewsletterConfirmationEmail } from '@/lib/newsletter/send-confirmation'
import { removeSubscriberFromEsp, syncSubscriberToEsp } from '@/lib/newsletter/sync-esp'
import type { NewsletterStatus, NewsletterSubscriberRow } from '@/lib/newsletter/types'
import { getSupabaseServerClient } from '@/lib/supabase-server'

function assertInternalSecret(req: Parameters<NonNullable<Endpoint['handler']>>[0]) {
  const secret = process.env.NEWSLETTER_INTERNAL_SECRET?.trim()
  if (!secret) throw new APIError('Newsletter internal API not configured', 503)
  const header = req.headers.get('x-newsletter-internal-secret') ?? req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (header !== secret) throw new APIError('Unauthorized', 401)
}

function assertMarketingStaff(req: Parameters<NonNullable<Endpoint['handler']>>[0]) {
  if (!req.user) throw new APIError('Unauthorized', 401)
  if (!hasStaffRole(req.user, ['superadmin', 'marketing'])) throw new APIError('Forbidden', 403)
}

function parseListQuery(url: string) {
  const { searchParams } = new URL(url)
  return {
    status: (searchParams.get('status') as NewsletterStatus | null) || undefined,
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    export: searchParams.get('export') === 'true',
  }
}

export const newsletterInternalSendEndpoint: Endpoint = {
  path: '/internal/newsletter/send-confirmation',
  method: 'post',
  handler: async (req) => {
    assertInternalSecret(req)
    const body = (await req.json?.()) as { subscriberId?: string } | undefined
    const subscriberId = body?.subscriberId?.trim()
    if (!subscriberId) throw new APIError('subscriberId required', 400)

    const supabase = getSupabaseServerClient()
    if (!supabase) throw new APIError('Supabase not configured', 503)

    const { data, error } = await supabase.from('newsletter_subscribers').select('*').eq('id', subscriberId).maybeSingle()
    if (error) throw new APIError(error.message, 500)
    if (!data) throw new APIError('Subscriber not found', 404)

    const subscriber = data as NewsletterSubscriberRow
    const sent = await sendNewsletterConfirmationEmail(req.payload, subscriber)
    return Response.json({ ok: sent })
  },
}

export const newsletterInternalSyncEndpoint: Endpoint = {
  path: '/internal/newsletter/sync',
  method: 'post',
  handler: async (req) => {
    assertInternalSecret(req)
    const body = (await req.json?.()) as {
      subscriberId?: string
      action?: 'upsert' | 'remove'
      brevoListId?: number | null
    } | undefined

    const subscriberId = body?.subscriberId?.trim()
    const action = body?.action ?? 'upsert'
    if (!subscriberId) throw new APIError('subscriberId required', 400)

    const supabase = getSupabaseServerClient()
    if (!supabase) throw new APIError('Supabase not configured', 503)

    const { data, error } = await supabase.from('newsletter_subscribers').select('*').eq('id', subscriberId).maybeSingle()
    if (error) throw new APIError(error.message, 500)
    if (!data) throw new APIError('Subscriber not found', 404)

    const subscriber = data as NewsletterSubscriberRow
    if (action === 'remove') {
      await removeSubscriberFromEsp(req.payload, subscriber, body?.brevoListId)
    } else {
      await syncSubscriberToEsp(req.payload, subscriber, body?.brevoListId)
    }

    return Response.json({ ok: true })
  },
}

export const newsletterSubscribersEndpoint: Endpoint = {
  path: '/newsletter-subscribers',
  method: 'get',
  handler: async (req) => {
    assertMarketingStaff(req)
    const supabase = getSupabaseServerClient()
    if (!supabase) throw new APIError('Supabase not configured', 503)

    const query = parseListQuery(req.url || '')

    if (query.export) {
      const rows = await listSubscribersForExport(supabase, query)
      const header = ['email', 'status', 'source', 'confirmed_at', 'web_profile_id', 'esp_synced_at']
      const csvLines = [
        header.join(','),
        ...rows.map((row) =>
          [
            JSON.stringify(row.email),
            row.status,
            row.source,
            row.confirmed_at ?? '',
            row.web_profile_id ?? '',
            row.esp_synced_at ?? '',
          ].join(','),
        ),
      ]
      return new Response(csvLines.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="newsletter-subscribers.csv"',
        },
      })
    }

    const result = await listSubscribers(supabase, query)
    return Response.json(result)
  },
}

export const newsletterSubscribersActionsEndpoint: Endpoint = {
  path: '/newsletter-subscribers/actions',
  method: 'post',
  handler: async (req) => {
    assertMarketingStaff(req)
    const body = (await req.json?.()) as {
      action?: 'resend' | 'resync'
      subscriberId?: string
      brevoListId?: number | null
    } | undefined

    const subscriberId = body?.subscriberId?.trim()
    if (!subscriberId || !body?.action) throw new APIError('action and subscriberId required', 400)

    if (body.action === 'resend') {
      const ok = await resendNewsletterConfirmation(req.payload, subscriberId)
      return Response.json({ ok })
    }

    const ok = await manualEspResync(req.payload, subscriberId, body.brevoListId)
    return Response.json({ ok })
  },
}

export const newsletterEndpoints = [
  newsletterInternalSendEndpoint,
  newsletterInternalSyncEndpoint,
  newsletterSubscribersEndpoint,
  newsletterSubscribersActionsEndpoint,
]
