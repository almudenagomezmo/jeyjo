import { APIError, type Endpoint, type Where } from 'payload'

import { isStorefrontQuoteApiKey } from '@/collections/Quotes'
import {
  assertAllowedRmaTransition,
  isRmaStatus,
  RMA_CLOSED_STATUSES,
  RMA_OPEN_STATUSES,
} from '@/collections/RmaIncidents/status-transitions'
import { fetchCustomersByIds, resolveCustomerLabel } from '@/lib/orders/customer-label'
import { requireOmsStaff } from '@/lib/orders/oms-access'
import { isRmaReason, type RmaReason } from '@/lib/rma/reason-labels'
import { sendRmaRequestEmail } from '@/lib/rma/send-rma-request-email'

const INBOX_LIMIT = 100
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000

type RmaInboxRow = {
  id: number
  rmaNumber: string | null
  createdAt: string
  customerLabel: string
  articleSku: string | null
  deliveryNoteNumber: string | null
  reason: string | null
  status: string | null
  emailSentAt: string | null
  adminUrl: string
}

function normalizeSku(value: string): string {
  return value.trim().toUpperCase()
}

function normalizeDeliveryNote(value: string): string {
  return value.trim()
}

function parseInboxQuery(url: URL): {
  status?: string
  dateFrom?: string
  dateTo?: string
  search?: string
} {
  return {
    status: url.searchParams.get('status') ?? undefined,
    dateFrom: url.searchParams.get('dateFrom') ?? undefined,
    dateTo: url.searchParams.get('dateTo') ?? undefined,
    search: url.searchParams.get('search')?.trim() || undefined,
  }
}

function buildInboxWhere(query: ReturnType<typeof parseInboxQuery>): Where {
  const clauses: Where[] = []
  if (query.status) clauses.push({ status: { equals: query.status } })
  if (query.dateFrom) clauses.push({ createdAt: { greater_than_equal: query.dateFrom } })
  if (query.dateTo) clauses.push({ createdAt: { less_than_equal: query.dateTo } })
  if (query.search) {
    clauses.push({
      or: [
        { rmaNumber: { contains: query.search } },
        { articleSku: { contains: query.search } },
        { deliveryNoteNumber: { contains: query.search } },
        { customerRef: { contains: query.search } },
      ],
    })
  }
  if (clauses.length === 0) return {}
  if (clauses.length === 1) return clauses[0]!
  return { and: clauses }
}

function statusFilterWhere(status: string | undefined): Where | undefined {
  if (!status || status === 'all') return undefined
  if (status === 'open') {
    return { status: { in: RMA_OPEN_STATUSES } }
  }
  if (status === 'closed') {
    return { status: { in: RMA_CLOSED_STATUSES } }
  }
  if (isRmaStatus(status)) {
    return { status: { equals: status } }
  }
  return undefined
}

async function findDuplicateIncident(
  payload: Parameters<Endpoint['handler']>[0]['payload'],
  customerRef: string,
  articleSku: string,
  deliveryNoteNumber: string,
): Promise<boolean> {
  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString()
  const found = await payload.find({
    collection: 'rma-incidents',
    where: {
      and: [
        { customerRef: { equals: customerRef } },
        { articleSku: { equals: articleSku } },
        { deliveryNoteNumber: { equals: deliveryNoteNumber } },
        { createdAt: { greater_than_equal: since } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return found.docs.length > 0
}

export const rmaStorefrontCreateEndpoint: Endpoint = {
  path: '/rma-incidents/storefront-create',
  method: 'post',
  handler: async (req) => {
    if (!isStorefrontQuoteApiKey(req)) {
      throw new APIError('Unauthorized', 401)
    }

    let body: {
      customerRef?: string | null
      customerEmail?: string | null
      articleSku?: string
      deliveryNoteNumber?: string
      reason?: string
      observations?: string | null
    }
    try {
      body = (await req.json?.()) as typeof body
    } catch {
      throw new APIError('Invalid JSON body', 400)
    }

    const customerRef = body.customerRef?.trim()
    const articleSku = body.articleSku?.trim()
    const deliveryNoteNumber = body.deliveryNoteNumber?.trim()
    const reason = body.reason?.trim()
    const observations = body.observations?.trim() ?? null

    if (!customerRef || !articleSku || !deliveryNoteNumber || !reason) {
      throw new APIError('customerRef, articleSku, deliveryNoteNumber and reason required', 400)
    }

    if (!isRmaReason(reason)) {
      throw new APIError('Invalid reason', 400)
    }

    if (articleSku.length < 1 || articleSku.length > 64) {
      throw new APIError('Invalid articleSku', 400)
    }
    if (deliveryNoteNumber.length < 3 || deliveryNoteNumber.length > 40) {
      throw new APIError('Invalid deliveryNoteNumber', 400)
    }

    if (reason === 'other') {
      if (!observations || observations.length < 10) {
        throw new APIError('observations required (min 10 characters) when reason is other', 400)
      }
    }

    const skuNorm = normalizeSku(articleSku)
    const noteNorm = normalizeDeliveryNote(deliveryNoteNumber)

    const duplicate = await findDuplicateIncident(req.payload, customerRef, skuNorm, noteNorm)
    if (duplicate) {
      throw new APIError('Duplicate RMA request for this article and delivery note within 24 hours', 409)
    }

    const created = await req.payload.create({
      collection: 'rma-incidents',
      data: {
        status: 'requested',
        customerRef,
        articleSku: skuNorm,
        deliveryNoteNumber: noteNorm,
        reason,
        observations,
      },
      req,
      overrideAccess: true,
    })

    const emailTo =
      body.customerEmail?.trim() ||
      (await fetchCustomersByIds([customerRef])).get(customerRef)?.email ||
      null

    let emailSent = false
    if (emailTo) {
      emailSent = await sendRmaRequestEmail(req.payload, {
        to: emailTo,
        rmaNumber: created.rmaNumber ?? String(created.id),
        articleSku: skuNorm,
        deliveryNoteNumber: noteNorm,
        reason: reason as RmaReason,
        observations,
      })
    }

    if (emailSent) {
      await req.payload.update({
        collection: 'rma-incidents',
        id: created.id,
        data: { emailSentAt: new Date().toISOString() },
        req,
        overrideAccess: true,
      })
    }

    return Response.json({
      doc: {
        id: created.id,
        rmaNumber: created.rmaNumber,
        status: created.status,
        emailSent,
      },
    })
  },
}

export const rmaStorefrontListEndpoint: Endpoint = {
  path: '/rma-incidents/storefront-list',
  method: 'get',
  handler: async (req) => {
    if (!isStorefrontQuoteApiKey(req)) {
      throw new APIError('Unauthorized', 401)
    }

    const url = new URL(req.url ?? 'http://local', 'http://local')
    const customerRef = url.searchParams.get('customerRef')?.trim()
    if (!customerRef) throw new APIError('customerRef required', 400)

    const status = url.searchParams.get('status') ?? 'all'
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1)
    const pageSize = Math.min(
      50,
      Math.max(1, Number.parseInt(url.searchParams.get('pageSize') ?? '25', 10) || 25),
    )

    const statusWhere = statusFilterWhere(status)
    const where: Where = statusWhere
      ? { and: [{ customerRef: { equals: customerRef } }, statusWhere] }
      : { customerRef: { equals: customerRef } }

    const found = await req.payload.find({
      collection: 'rma-incidents',
      where,
      sort: '-createdAt',
      page,
      limit: pageSize,
      depth: 0,
      overrideAccess: true,
    })

    return Response.json({
      docs: found.docs.map((d) => ({
        id: d.id,
        rmaNumber: d.rmaNumber,
        status: d.status,
        articleSku: d.articleSku,
        deliveryNoteNumber: d.deliveryNoteNumber,
        reason: d.reason,
        observations: d.observations ?? null,
        createdAt: d.createdAt,
        emailSentAt: d.emailSentAt ?? null,
      })),
      total: found.totalDocs,
      page,
      pageSize,
    })
  },
}

export const rmaInboxSummaryEndpoint: Endpoint = {
  path: '/rma-incidents/inbox-summary',
  method: 'get',
  handler: async (req) => {
    await requireOmsStaff(req)

    const query = parseInboxQuery(new URL(req.url ?? 'http://local', 'http://local'))
    const found = await req.payload.find({
      collection: 'rma-incidents',
      where: buildInboxWhere(query),
      sort: '-createdAt',
      limit: INBOX_LIMIT,
      depth: 0,
      req,
      overrideAccess: false,
    })

    const customerIds = found.docs
      .map((d) => d.customerRef?.trim())
      .filter((id): id is string => Boolean(id))
    const customers = await fetchCustomersByIds(customerIds)

    const docs: RmaInboxRow[] = found.docs.map((row) => {
      const customer = row.customerRef ? customers.get(row.customerRef) : undefined
      return {
        id: row.id,
        rmaNumber: row.rmaNumber ?? null,
        createdAt: row.createdAt,
        customerLabel: resolveCustomerLabel(
          { guestEmail: null, customerRef: row.customerRef },
          customer,
        ),
        articleSku: row.articleSku ?? null,
        deliveryNoteNumber: row.deliveryNoteNumber ?? null,
        reason: row.reason ?? null,
        status: row.status ?? null,
        emailSentAt: row.emailSentAt ?? null,
        adminUrl: `/admin/collections/rma-incidents/${row.id}`,
      }
    })

    return Response.json({ docs, totalDocs: found.totalDocs })
  },
}

export const rmaStatusPatchEndpoint: Endpoint = {
  path: '/rma-incidents/:id/status',
  method: 'patch',
  handler: async (req) => {
    await requireOmsStaff(req)

    const id = Number(req.routeParams?.id)
    if (!Number.isFinite(id)) throw new APIError('Invalid RMA id', 400)

    const body = (await req.json?.()) as { status?: string }
    const next = body.status
    if (!next || !isRmaStatus(next)) {
      throw new APIError('Valid status required', 400)
    }

    const existing = await req.payload.findByID({
      collection: 'rma-incidents',
      id,
      depth: 0,
      req,
      overrideAccess: false,
    })

    assertAllowedRmaTransition(existing.status as never, next)

    const updated = await req.payload.update({
      collection: 'rma-incidents',
      id,
      data: { status: next },
      req,
      overrideAccess: false,
    })

    return Response.json({ doc: updated })
  },
}

export const rmaOmsEndpoints: Endpoint[] = [
  rmaStorefrontCreateEndpoint,
  rmaStorefrontListEndpoint,
  rmaInboxSummaryEndpoint,
  rmaStatusPatchEndpoint,
]
