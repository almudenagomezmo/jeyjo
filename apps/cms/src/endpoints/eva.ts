import { APIError, type Endpoint } from 'payload'

import { ingestSkaiOrder } from '@/eva/ingest-order'
import { signEvaContextToken, verifyEvaContextToken } from '@/eva/jwt'
import { resolveEvaContext } from '@/eva/resolve-context'
import type { SkaiOrderPayload } from '@/eva/types'
import { verifySkaiWebhookSignature } from '@/eva/webhook-signature'
import { canAccessSkaiConfig } from '@/lib/skai-access'
import { getSkaiAdapter } from '@/eva/registry'

const rateHits = new Map<string, number>()
const RATE_WINDOW_MS = 5_000

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const last = rateHits.get(key) ?? 0
  if (now - last < RATE_WINDOW_MS) return true
  rateHits.set(key, now)
  return false
}

function parseSkaiOrderPayload(raw: unknown): SkaiOrderPayload {
  if (!raw || typeof raw !== 'object') {
    throw new APIError('Invalid order payload', 400)
  }
  const body = raw as Record<string, unknown>
  const skaiExternalId = String(body.skaiExternalId ?? '').trim()
  if (!skaiExternalId) throw new APIError('skaiExternalId required', 400)
  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    throw new APIError('lines required', 400)
  }

  const lines = body.lines.map((line, index) => {
    if (!line || typeof line !== 'object') {
      throw new APIError(`Invalid line at index ${index}`, 400)
    }
    const row = line as Record<string, unknown>
    const skuErp = String(row.skuErp ?? '').trim()
    const name = String(row.name ?? '').trim()
    const qty = Number(row.qty)
    const unitPrice = Number(row.unitPrice)
    if (!skuErp || !name || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(unitPrice)) {
      throw new APIError(`Invalid line at index ${index}`, 400)
    }
    return { skuErp, name, qty, unitPrice }
  })

  return {
    skaiExternalId,
    customerRef: body.customerRef != null ? String(body.customerRef) : null,
    guestEmail: body.guestEmail != null ? String(body.guestEmail) : null,
    customerNotes: body.customerNotes != null ? String(body.customerNotes) : null,
    lines,
  }
}

export const evaContextEndpoint: Endpoint = {
  path: '/eva/context',
  method: 'get',
  handler: async (req) => {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (isRateLimited(`eva-context:${ip}`)) {
      throw new APIError('Too many requests', 429)
    }

    const auth = req.headers.get('authorization')
    const token = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : null
    if (!token) throw new APIError('Unauthorized', 401)

    let claims
    try {
      claims = verifyEvaContextToken(token)
    } catch {
      throw new APIError('Invalid context token', 401)
    }

    const context = await resolveEvaContext(req.payload, claims)
    return Response.json(context)
  },
}

export const evaOrdersWebhookEndpoint: Endpoint = {
  path: '/eva/orders',
  method: 'post',
  handler: async (req) => {
    const raw = await req.text?.()
    if (!raw) throw new APIError('Empty body', 400)

    const signature = req.headers.get('x-skai-signature')
    if (!verifySkaiWebhookSignature(raw, signature)) {
      throw new APIError('Unauthorized', 401)
    }

    let json: unknown
    try {
      json = JSON.parse(raw)
    } catch {
      throw new APIError('Invalid JSON', 400)
    }

    const payload = parseSkaiOrderPayload(json)
    const result = await ingestSkaiOrder(req.payload, payload)

    return Response.json(
      {
        id: result.id,
        orderNumber: result.orderNumber,
        created: result.created,
        adminUrl: `/admin/collections/orders/${result.id}`,
      },
      { status: result.created ? 201 : 200 },
    )
  },
}

export const skaiStatusEndpoint: Endpoint = {
  path: '/skai/status',
  method: 'get',
  handler: async (req) => {
    if (!canAccessSkaiConfig(req)) {
      if (!req.user) throw new APIError('Unauthorized', 401)
      throw new APIError('Forbidden', 403)
    }

    const adapter = getSkaiAdapter()
    const [health, metrics] = await Promise.all([
      adapter.validateConnection(),
      adapter.getConversationMetrics(),
    ])

    const settings = await req.payload.findGlobal({
      slug: 'skaiSettings',
      depth: 0,
      overrideAccess: true,
    })

    return Response.json({
      adapterKind: adapter.kind,
      health,
      metrics,
      settings,
      widget: adapter.getWidgetConfig(),
    })
  },
}

export const skaiTestTokenEndpoint: Endpoint = {
  path: '/skai/test-token',
  method: 'post',
  handler: async (req) => {
    if (!canAccessSkaiConfig(req)) {
      if (!req.user) throw new APIError('Unauthorized', 401)
      throw new APIError('Forbidden', 403)
    }

    const token = signEvaContextToken({
      sub: 'anonymous',
      channel: 'storefront',
      page: { path: '/admin/skai-config', productSku: undefined },
    })

    return Response.json({ contextToken: token })
  },
}
