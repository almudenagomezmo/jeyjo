import { createHmac, timingSafeEqual } from 'node:crypto'

import { APIError, type Endpoint, type Where } from 'payload'

import { isStorefrontQuoteApiKey } from '@/collections/Quotes'
import {
  assertAllowedQuoteTransition,
  canConvertQuoteToOrder,
  isQuoteStatus,
} from '@/collections/Quotes/status-transitions'
import { fetchCustomersByIds, resolveCustomerLabel } from '@/lib/orders/customer-label'
import { requireOmsStaff } from '@/lib/orders/oms-access'
import {
  mapQuoteToOrderCreateData,
  mapStorefrontInputToQuoteData,
  parseQuoteLineSnapshots,
  type StorefrontQuoteCreateInput,
} from '@/lib/quotes/map-quote-input'
import { sendQuoteRequestEmail } from '@/lib/quotes/send-quote-request-email'
import type { Quote } from '@/payload-types'

const INBOX_LIMIT = 100

type QuoteInboxRow = {
  id: number
  quoteNumber: string | null
  createdAt: string
  customerLabel: string
  amount: number | null
  status: string | null
  segment: string | null
  emailSentAt: string | null
  convertedOrderId: number | null
  adminUrl: string
  orderAdminUrl: string | null
}

type PreparePayload = {
  exp: number
  segment: 'b2c' | 'b2b'
  totals: {
    subtotal: number
    shippingCost: number
    total: number
  }
  lineSnapshots: StorefrontQuoteCreateInput['lineSnapshots']
}

function verifyPrepareToken(token: string): PreparePayload | null {
  const secret =
    process.env.QUOTE_PREPARE_SECRET ??
    process.env.CHECKOUT_SIGNING_SECRET ??
    process.env.STOREFRONT_PAYLOAD_API_KEY
  if (!secret) return null
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return null
  const body = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = createHmac('sha256', secret).update(body).digest('base64url')
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  try {
    const payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as PreparePayload
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

function parseInboxQuery(url: URL): {
  status?: string
  segment?: string
  dateFrom?: string
  dateTo?: string
  search?: string
} {
  return {
    status: url.searchParams.get('status') ?? undefined,
    segment: url.searchParams.get('segment') ?? undefined,
    dateFrom: url.searchParams.get('dateFrom') ?? undefined,
    dateTo: url.searchParams.get('dateTo') ?? undefined,
    search: url.searchParams.get('search')?.trim() || undefined,
  }
}

function buildInboxWhere(query: ReturnType<typeof parseInboxQuery>): Where {
  const clauses: Where[] = []
  if (query.status) clauses.push({ status: { equals: query.status } })
  if (query.segment) clauses.push({ segment: { equals: query.segment } })
  if (query.dateFrom) clauses.push({ createdAt: { greater_than_equal: query.dateFrom } })
  if (query.dateTo) clauses.push({ createdAt: { less_than_equal: query.dateTo } })
  if (query.search) {
    clauses.push({
      or: [
        { quoteNumber: { contains: query.search } },
        { guestEmail: { contains: query.search } },
        { customerRef: { contains: query.search } },
      ],
    })
  }
  if (clauses.length === 0) return {}
  if (clauses.length === 1) return clauses[0]!
  return { and: clauses }
}

function resolveConvertedOrderId(quote: Quote): number | null {
  const ref = quote.convertedOrderRef
  if (ref == null) return null
  if (typeof ref === 'number') return ref
  if (typeof ref === 'object' && 'id' in ref) return Number(ref.id) || null
  return null
}

export const quotesStorefrontCreateEndpoint: Endpoint = {
  path: '/quotes/storefront-create',
  method: 'post',
  handler: async (req) => {
    if (!isStorefrontQuoteApiKey(req)) {
      throw new APIError('Unauthorized', 401)
    }

    let body: {
      prepareToken?: string
      customerRef?: string | null
      guestEmail?: string | null
      deliveryMethod?: string
      pickupStoreLabel?: string | null
      shippingAddressSnapshot?: Record<string, unknown> | null
      billingAddressSnapshot?: Record<string, unknown> | null
      customerNotes?: string | null
    }
    try {
      body = (await req.json?.()) as typeof body
    } catch {
      throw new APIError('Invalid JSON body', 400)
    }

    const prepareToken = body.prepareToken?.trim()
    if (!prepareToken) throw new APIError('prepareToken required', 400)

    const prepare = verifyPrepareToken(prepareToken)
    if (!prepare) throw new APIError('Invalid or expired prepare token', 400)

    const deliveryMethod = body.deliveryMethod?.trim()
    if (
      !deliveryMethod ||
      !['home', 'alternate_address', 'pickup_alfaro', 'pickup_rincon'].includes(deliveryMethod)
    ) {
      throw new APIError('Invalid delivery method', 400)
    }

    const guestEmail = body.guestEmail?.trim() || null
    if (!body.customerRef?.trim() && !guestEmail) {
      throw new APIError('Guest email or customerRef required', 400)
    }

    const notes = body.customerNotes?.trim() ?? null
    if (notes && notes.length > 500) {
      throw new APIError('Observations max 500 characters', 400)
    }

    const input: StorefrontQuoteCreateInput = {
      segment: prepare.segment,
      customerRef: body.customerRef?.trim() || null,
      guestEmail,
      deliveryMethod,
      pickupStoreLabel: body.pickupStoreLabel?.trim() || null,
      shippingAddressSnapshot: body.shippingAddressSnapshot ?? null,
      billingAddressSnapshot: body.billingAddressSnapshot ?? null,
      customerNotes: notes,
      subtotal: prepare.totals.subtotal,
      shippingCost: prepare.totals.shippingCost,
      amount: prepare.totals.total,
      lineSnapshots: prepare.lineSnapshots,
    }

    const created = await req.payload.create({
      collection: 'quotes',
      data: mapStorefrontInputToQuoteData(input) as never,
      req,
      overrideAccess: true,
    })

    const emailTo =
      guestEmail ||
      (body.customerRef?.trim()
        ? (await fetchCustomersByIds([body.customerRef.trim()])).get(body.customerRef.trim())
            ?.email
        : undefined) ||
      null
    let emailSent = false
    if (emailTo) {
      emailSent = await sendQuoteRequestEmail(req.payload, {
        to: emailTo,
        quoteNumber: created.quoteNumber ?? String(created.id),
        lineSnapshots: parseQuoteLineSnapshots(created.lineSnapshots),
        amount: created.amount ?? null,
      })
    }

    if (emailSent) {
      await req.payload.update({
        collection: 'quotes',
        id: created.id,
        data: { emailSentAt: new Date().toISOString() },
        req,
        overrideAccess: true,
      })
    }

    return Response.json({
      doc: {
        id: created.id,
        quoteNumber: created.quoteNumber,
        status: created.status,
      },
    })
  },
}

export const quotesInboxSummaryEndpoint: Endpoint = {
  path: '/quotes/inbox-summary',
  method: 'get',
  handler: async (req) => {
    await requireOmsStaff(req)

    const query = parseInboxQuery(new URL(req.url ?? 'http://local', 'http://local'))
    const found = await req.payload.find({
      collection: 'quotes',
      where: buildInboxWhere(query),
      sort: '-createdAt',
      limit: INBOX_LIMIT,
      depth: 1,
      req,
      overrideAccess: false,
    })

    const customerIds = found.docs
      .map((d) => d.customerRef?.trim())
      .filter((id): id is string => Boolean(id))
    const customers = await fetchCustomersByIds(customerIds)

    const docs: QuoteInboxRow[] = found.docs.map((quote) => {
      const customer = quote.customerRef ? customers.get(quote.customerRef) : undefined
      const orderId = resolveConvertedOrderId(quote as Quote)
      return {
        id: quote.id,
        quoteNumber: quote.quoteNumber ?? null,
        createdAt: quote.createdAt,
        customerLabel: resolveCustomerLabel(
          { guestEmail: quote.guestEmail, customerRef: quote.customerRef },
          customer,
        ),
        amount: quote.amount ?? null,
        status: quote.status ?? null,
        segment: quote.segment ?? null,
        emailSentAt: quote.emailSentAt ?? null,
        convertedOrderId: orderId,
        adminUrl: `/admin/collections/quotes/${quote.id}`,
        orderAdminUrl: orderId ? `/admin/collections/orders/${orderId}` : null,
      }
    })

    return Response.json({ docs, totalDocs: found.totalDocs })
  },
}

export const quotesStatusPatchEndpoint: Endpoint = {
  path: '/quotes/:id/status',
  method: 'patch',
  handler: async (req) => {
    await requireOmsStaff(req)

    const id = Number(req.routeParams?.id)
    if (!Number.isFinite(id)) throw new APIError('Invalid quote id', 400)

    const body = (await req.json?.()) as { status?: string }
    const next = body.status
    if (!next || !isQuoteStatus(next)) {
      throw new APIError('Valid status required', 400)
    }

    const existing = await req.payload.findByID({
      collection: 'quotes',
      id,
      depth: 0,
      req,
      overrideAccess: false,
    })

    assertAllowedQuoteTransition(existing.status as never, next)

    const updated = await req.payload.update({
      collection: 'quotes',
      id,
      data: { status: next },
      req,
      overrideAccess: false,
    })

    return Response.json({ doc: updated })
  },
}

export const quotesConvertToOrderEndpoint: Endpoint = {
  path: '/quotes/:id/convert-to-order',
  method: 'post',
  handler: async (req) => {
    await requireOmsStaff(req)

    const id = Number(req.routeParams?.id)
    if (!Number.isFinite(id)) throw new APIError('Invalid quote id', 400)

    const quote = await req.payload.findByID({
      collection: 'quotes',
      id,
      depth: 0,
      req,
      overrideAccess: false,
    })

    if (!canConvertQuoteToOrder(quote.status as never)) {
      throw new APIError('Quote must be in accepted status to convert', 400)
    }

    if (resolveConvertedOrderId(quote as Quote)) {
      throw new APIError('Quote already converted', 400)
    }

    const segment = quote.segment === 'b2b' ? 'b2b' : 'b2c'
    const orderData = mapQuoteToOrderCreateData({
      quoteNumber: quote.quoteNumber ?? String(quote.id),
      segment,
      customerRef: quote.customerRef ?? null,
      guestEmail: quote.guestEmail ?? null,
      deliveryMethod: quote.deliveryMethod ?? null,
      pickupStoreLabel: quote.pickupStoreLabel ?? null,
      shippingAddressSnapshot: quote.shippingAddressSnapshot as Record<string, unknown> | null,
      billingAddressSnapshot: quote.billingAddressSnapshot as Record<string, unknown> | null,
      customerNotes: quote.customerNotes ?? null,
      shippingCost: quote.shippingCost ?? null,
      amount: quote.amount ?? null,
      lineSnapshots: parseQuoteLineSnapshots(quote.lineSnapshots),
    })

    const order = await req.payload.create({
      collection: 'orders',
      data: orderData as never,
      req,
      overrideAccess: false,
    })

    const updated = await req.payload.update({
      collection: 'quotes',
      id,
      data: {
        status: 'ordered',
        convertedOrderRef: order.id,
      },
      req,
      overrideAccess: false,
    })

    return Response.json({
      doc: updated,
      order: { id: order.id, orderNumber: order.orderNumber },
    })
  },
}

export const quotesStorefrontMineEndpoint: Endpoint = {
  path: '/quotes/storefront-mine',
  method: 'get',
  handler: async (req) => {
    if (!isStorefrontQuoteApiKey(req)) {
      throw new APIError('Unauthorized', 401)
    }

    const url = new URL(req.url ?? 'http://local', 'http://local')
    const customerRef = url.searchParams.get('customerRef')?.trim()
    if (!customerRef) throw new APIError('customerRef required', 400)

    const found = await req.payload.find({
      collection: 'quotes',
      where: { customerRef: { equals: customerRef } },
      sort: '-createdAt',
      limit: 50,
      depth: 0,
      overrideAccess: true,
    })

    return Response.json({
      docs: found.docs.map((q) => ({
        id: q.id,
        quoteNumber: q.quoteNumber,
        status: q.status,
        amount: q.amount,
        createdAt: q.createdAt,
      })),
    })
  },
}

export const quotesOmsEndpoints: Endpoint[] = [
  quotesStorefrontCreateEndpoint,
  quotesStorefrontMineEndpoint,
  quotesInboxSummaryEndpoint,
  quotesStatusPatchEndpoint,
  quotesConvertToOrderEndpoint,
]
