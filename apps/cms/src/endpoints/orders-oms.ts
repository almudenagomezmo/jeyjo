import {
  serializeAvansuiteXlsx,
  validateAvansuiteOrders,
  type OrderExportInput,
} from '@jeyjo/order-export'
import { APIError, type Endpoint, type Where } from 'payload'

import { isStorefrontOrderApiKey } from '@/collections/Orders'
import { isJeyjoOrderStatus } from '@/collections/Orders/status-transitions'
import { fetchCustomersByIds, resolveCustomerLabel } from '@/lib/orders/customer-label'
import { mapOrderToExportInput } from '@/lib/orders/map-export-input'
import { isOrderExportable, requireOmsStaff } from '@/lib/orders/oms-access'
import { parseOrderLineSnapshots } from '@/lib/orders/parse-line-snapshots'
import { computeStockValidationPending } from '@/lib/orders/stock-check'
import type { Order } from '@/payload-types'

const INBOX_LIMIT = 100
const EXPORT_MAX = 50

type InboxRow = {
  id: number
  orderNumber: string | null
  createdAt: string
  customerLabel: string
  amount: number | null
  jeyjoStatus: string | null
  origin: string | null
  stockValidationPending: boolean | null
  validatedEva: boolean | null
  adminUrl: string
}

function parseInboxQuery(url: URL): {
  origin?: string
  jeyjoStatus?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  evaQueue?: boolean
} {
  return {
    origin: url.searchParams.get('origin') ?? undefined,
    jeyjoStatus: url.searchParams.get('jeyjoStatus') ?? undefined,
    dateFrom: url.searchParams.get('dateFrom') ?? undefined,
    dateTo: url.searchParams.get('dateTo') ?? undefined,
    search: url.searchParams.get('search')?.trim() || undefined,
    evaQueue: url.searchParams.get('evaQueue') === 'true',
  }
}

function buildInboxWhere(query: ReturnType<typeof parseInboxQuery>): Where {
  const clauses: Where[] = []

  if (query.evaQueue) {
    clauses.push({ origin: { equals: 'eva' } })
    clauses.push({ validatedEva: { equals: false } })
    clauses.push({ jeyjoStatus: { not_equals: 'cancelled' } })
  } else if (query.origin) {
    clauses.push({ origin: { equals: query.origin } })
  }

  if (query.jeyjoStatus) {
    clauses.push({ jeyjoStatus: { equals: query.jeyjoStatus } })
  }

  if (query.dateFrom) {
    clauses.push({ createdAt: { greater_than_equal: query.dateFrom } })
  }
  if (query.dateTo) {
    clauses.push({ createdAt: { less_than_equal: query.dateTo } })
  }

  if (query.search) {
    clauses.push({
      or: [
        { orderNumber: { contains: query.search } },
        { guestEmail: { contains: query.search } },
        { customerRef: { contains: query.search } },
      ],
    })
  }

  if (clauses.length === 0) return {}
  if (clauses.length === 1) return clauses[0]!
  return { and: clauses }
}

async function loadOrdersForExport(
  req: Parameters<Endpoint['handler']>[0],
  ids: number[],
): Promise<{ orders: Order[]; inputs: OrderExportInput[] }> {
  const orders: Order[] = []
  const inputs: OrderExportInput[] = []
  const customerIds: string[] = []

  for (const id of ids) {
    const order = await req.payload.findByID({
      collection: 'orders',
      id,
      depth: 0,
      req,
      overrideAccess: false,
    })
    if (!isOrderExportable(order)) {
      throw new APIError(`Order ${order.orderNumber ?? id} is not exportable`, 400)
    }
    if (!parseOrderLineSnapshots(order.orderLineSnapshots).length) {
      throw new APIError(`Order ${order.orderNumber ?? id} has no line snapshots`, 400)
    }
    orders.push(order)
    if (order.customerRef?.trim()) customerIds.push(order.customerRef.trim())
  }

  const customers = await fetchCustomersByIds(customerIds)

  for (const order of orders) {
    const customer = order.customerRef ? customers.get(order.customerRef) : undefined
    inputs.push(
      mapOrderToExportInput(order, customer
        ? {
            erpCode: customer.erp_code,
            taxId: customer.tax_id,
            commercialName: customer.commercial_name,
          }
        : null),
    )
  }

  return { orders, inputs }
}

export const ordersInboxSummaryEndpoint: Endpoint = {
  path: '/inbox-summary',
  method: 'get',
  handler: async (req) => {
    await requireOmsStaff(req)

    const query = parseInboxQuery(new URL(req.url ?? 'http://local', 'http://local'))
    const found = await req.payload.find({
      collection: 'orders',
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

    const docs: InboxRow[] = []
    for (const order of found.docs) {
      const customer = order.customerRef ? customers.get(order.customerRef) : undefined
      let stockPending = Boolean(order.stockValidationPending)
      if (!stockPending) {
        stockPending = await computeStockValidationPending(req.payload, order.orderLineSnapshots)
      }

      docs.push({
        id: order.id,
        orderNumber: order.orderNumber ?? null,
        createdAt: order.createdAt,
        customerLabel: resolveCustomerLabel(order, customer),
        amount: order.amount ?? null,
        jeyjoStatus: order.jeyjoStatus ?? null,
        origin: order.origin ?? null,
        stockValidationPending: stockPending,
        validatedEva: order.validatedEva ?? null,
        adminUrl: `/admin/collections/orders/${order.id}`,
      })
    }

    return Response.json({ docs, totalDocs: found.totalDocs })
  },
}

export const ordersExportAvansuiteEndpoint: Endpoint = {
  path: '/export-avansuite',
  method: 'post',
  handler: async (req) => {
    await requireOmsStaff(req)

    const { isWebNativeMode } = await import('@/lib/web-native-mode')
    if (await isWebNativeMode(req.payload)) {
      return Response.json(
        { error: 'Exportación Avansuite deshabilitada en modo web-native' },
        { status: 410 },
      )
    }

    let body: { orderIds?: (number | string)[] }
    try {
      body = (await req.json?.()) as { orderIds?: (number | string)[] }
    } catch {
      throw new APIError('Invalid JSON body', 400)
    }

    const rawIds = body.orderIds ?? []
    if (!rawIds.length) throw new APIError('orderIds required', 400)
    if (rawIds.length > EXPORT_MAX) {
      throw new APIError(`Maximum ${EXPORT_MAX} orders per export`, 400)
    }

    const ids = rawIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))
    const { orders, inputs } = await loadOrdersForExport(req, ids)

    const validation = validateAvansuiteOrders(inputs)
    if (!validation.ok) {
      throw new APIError(
        `Export validation failed: ${validation.issues.map((i) => i.message).join('; ')}`,
        400,
      )
    }

    const buffer = await serializeAvansuiteXlsx(inputs)
    const exportedAt = new Date().toISOString()

    for (const order of orders) {
      await req.payload.update({
        collection: 'orders',
        id: order.id,
        data: { exportedToErpAt: exportedAt },
        req,
        overrideAccess: false,
      })
    }

    const filename =
      orders.length === 1
        ? `pedido-${orders[0]?.orderNumber ?? orders[0]?.id}.xlsx`
        : `pedidos-avansuite-${exportedAt.slice(0, 10)}.xlsx`

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  },
}

export const ordersEvaValidateEndpoint: Endpoint = {
  path: '/eva/validate',
  method: 'post',
  handler: async (req) => {
    await requireOmsStaff(req)

    const body = (await req.json?.()) as { orderId?: number | string }
    const orderId = Number(body.orderId)
    if (!Number.isFinite(orderId)) throw new APIError('orderId required', 400)

    const order = await req.payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 0,
      req,
      overrideAccess: false,
    })

    if (order.origin !== 'eva') throw new APIError('Not an EVA order', 400)
    if (order.validatedEva) throw new APIError('Order already validated', 400)

    const nextStatus =
      order.jeyjoStatus === 'pending_confirmation' ? 'confirmed' : order.jeyjoStatus

    const updated = await req.payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        validatedEva: true,
        jeyjoStatus: nextStatus,
        evaRejectionReason: null,
      },
      req,
      overrideAccess: false,
    })

    return Response.json({ doc: updated })
  },
}

export const ordersEvaRejectEndpoint: Endpoint = {
  path: '/eva/reject',
  method: 'post',
  handler: async (req) => {
    await requireOmsStaff(req)

    const body = (await req.json?.()) as { orderId?: number | string; reason?: string }
    const orderId = Number(body.orderId)
    if (!Number.isFinite(orderId)) throw new APIError('orderId required', 400)

    const order = await req.payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 0,
      req,
      overrideAccess: false,
    })

    if (order.origin !== 'eva') throw new APIError('Not an EVA order', 400)

    const updated = await req.payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        jeyjoStatus: 'cancelled',
        validatedEva: false,
        evaRejectionReason: body.reason?.trim() || null,
      },
      req,
      overrideAccess: false,
    })

    return Response.json({ doc: updated })
  },
}

export const ordersRecheckStockEndpoint: Endpoint = {
  path: '/recheck-stock',
  method: 'post',
  handler: async (req) => {
    await requireOmsStaff(req)

    const body = (await req.json?.()) as { orderId?: number | string }
    const orderId = Number(body.orderId)
    if (!Number.isFinite(orderId)) throw new APIError('orderId required', 400)

    const order = await req.payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 0,
      req,
      overrideAccess: false,
    })

    const pending = await computeStockValidationPending(req.payload, order.orderLineSnapshots)
    const updated = await req.payload.update({
      collection: 'orders',
      id: orderId,
      data: { stockValidationPending: pending },
      req,
      overrideAccess: false,
    })

    return Response.json({ doc: updated, stockValidationPending: pending })
  },
}

export const ordersStatusPatchEndpoint: Endpoint = {
  path: '/:id/status',
  method: 'patch',
  handler: async (req) => {
    await requireOmsStaff(req)

    const id = Number(req.routeParams?.id)
    if (!Number.isFinite(id)) throw new APIError('Invalid order id', 400)

    const body = (await req.json?.()) as { jeyjoStatus?: string }
    const next = body.jeyjoStatus
    if (!next || !isJeyjoOrderStatus(next)) {
      throw new APIError('Valid jeyjoStatus required', 400)
    }

    const updated = await req.payload.update({
      collection: 'orders',
      id,
      data: { jeyjoStatus: next },
      req,
      overrideAccess: false,
    })

    return Response.json({ doc: updated })
  },
}

export const ordersStorefrontMineEndpoint: Endpoint = {
  path: '/storefront-mine',
  method: 'get',
  handler: async (req) => {
    if (!isStorefrontOrderApiKey(req)) {
      throw new APIError('Unauthorized', 401)
    }

    const url = new URL(req.url ?? 'http://local', 'http://local')
    const customerRef = url.searchParams.get('customerRef')?.trim()
    if (!customerRef) throw new APIError('customerRef required', 400)

    const limitRaw = url.searchParams.get('limit')
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 50
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 200) : 50
    const includeLineSnapshots = url.searchParams.get('includeLineSnapshots') === '1'

    const found = await req.payload.find({
      collection: 'orders',
      where: { customerRef: { equals: customerRef } },
      sort: '-createdAt',
      limit: safeLimit,
      depth: 0,
      overrideAccess: true,
    })

    return Response.json({
      docs: found.docs.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber ?? null,
        createdAt: order.createdAt,
        jeyjoStatus: order.jeyjoStatus ?? null,
        origin: order.origin ?? null,
        amount: order.amount ?? null,
        deliveryMethod: order.deliveryMethod ?? null,
        pickupStoreLabel: order.pickupStoreLabel ?? null,
        ...(includeLineSnapshots ? { orderLineSnapshots: order.orderLineSnapshots ?? null } : {}),
      })),
    })
  },
}

function mapStorefrontOrderDetail(order: Order) {
  return {
    id: order.id,
    orderNumber: order.orderNumber ?? null,
    createdAt: order.createdAt,
    jeyjoStatus: order.jeyjoStatus ?? null,
    origin: order.origin ?? null,
    amount: order.amount ?? null,
    shippingCost: order.shippingCost ?? null,
    deliveryMethod: order.deliveryMethod ?? null,
    pickupStoreLabel: order.pickupStoreLabel ?? null,
    paymentMethodLabel: order.paymentMethodLabel ?? null,
    couponCode: order.couponCode ?? null,
    customerNotes: order.customerNotes ?? null,
    orderLineSnapshots: order.orderLineSnapshots ?? null,
  }
}

export const ordersStorefrontDetailEndpoint: Endpoint = {
  path: '/storefront-detail',
  method: 'get',
  handler: async (req) => {
    if (!isStorefrontOrderApiKey(req)) {
      throw new APIError('Unauthorized', 401)
    }

    const url = new URL(req.url ?? 'http://local', 'http://local')
    const customerRef = url.searchParams.get('customerRef')?.trim()
    const orderId = Number(url.searchParams.get('orderId'))
    if (!customerRef || !Number.isFinite(orderId)) {
      throw new APIError('customerRef and orderId required', 400)
    }

    const order = await req.payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 0,
      overrideAccess: true,
    })

    if (order.customerRef?.trim() !== customerRef) {
      throw new APIError('Order not found', 404)
    }

    return Response.json({ doc: mapStorefrontOrderDetail(order) })
  },
}

export const ordersOmsEndpoints: Endpoint[] = [
  ordersInboxSummaryEndpoint,
  ordersExportAvansuiteEndpoint,
  ordersEvaValidateEndpoint,
  ordersEvaRejectEndpoint,
  ordersRecheckStockEndpoint,
  ordersStatusPatchEndpoint,
  ordersStorefrontMineEndpoint,
  ordersStorefrontDetailEndpoint,
]
