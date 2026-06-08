import { APIError, type Endpoint, type Where } from 'payload'

import { isStorefrontQuoteApiKey } from '@/collections/Quotes'
import {
  assertAllowedReviewTransition,
  isReviewStatus,
} from '@/collections/ProductReviews/status-transitions'
import { canAccessCatalogImport } from '@/lib/catalog-import-access'

const INBOX_LIMIT = 100

type ReviewInboxRow = {
  id: number
  status: string | null
  previousStatus: string | null
  productTitle: string | null
  skuErp: string | null
  rating: number | null
  authorDisplayName: string | null
  createdAt: string
  isReedition: boolean
  adminUrl: string
}

function parseInboxQuery(url: URL): {
  status?: string
  search?: string
} {
  return {
    status: url.searchParams.get('status') ?? undefined,
    search: url.searchParams.get('search')?.trim() || undefined,
  }
}

function buildInboxWhere(query: ReturnType<typeof parseInboxQuery>): Where {
  const clauses: Where[] = []
  const status = query.status ?? 'pending'
  if (status && status !== 'all') {
    clauses.push({ status: { equals: status } })
  }
  if (query.search) {
    clauses.push({
      or: [
        { skuErp: { contains: query.search } },
        { authorDisplayName: { contains: query.search } },
      ],
    })
  }
  if (clauses.length === 0) return {}
  if (clauses.length === 1) return clauses[0]!
  return { and: clauses }
}

function requireCatalogStaff(req: Parameters<Endpoint['handler']>[0]): void {
  if (!canAccessCatalogImport(req)) {
    throw new APIError('Forbidden', 403)
  }
}

function productTitleFromRelation(product: unknown): string | null {
  if (product && typeof product === 'object' && 'title' in product) {
    const title = (product as { title?: string | null }).title
    return title?.trim() || null
  }
  return null
}

export const productReviewsStorefrontCreateEndpoint: Endpoint = {
  path: '/storefront-create',
  method: 'post',
  handler: async (req) => {
    if (!isStorefrontQuoteApiKey(req)) {
      throw new APIError('Unauthorized', 401)
    }

    let body: {
      productId?: number
      skuErp?: string
      customerId?: string
      webProfileId?: string
      authorDisplayName?: string
      rating?: number
      comment?: string
    }
    try {
      body = (await req.json?.()) as typeof body
    } catch {
      throw new APIError('Invalid JSON body', 400)
    }

    const productId = body.productId
    const skuErp = body.skuErp?.trim()
    const customerId = body.customerId?.trim()
    const webProfileId = body.webProfileId?.trim()
    const authorDisplayName = body.authorDisplayName?.trim()
    const rating = body.rating
    const comment = body.comment?.trim()

    if (
      !productId ||
      !skuErp ||
      !customerId ||
      !webProfileId ||
      !authorDisplayName ||
      rating == null ||
      !comment
    ) {
      throw new APIError('Missing required fields', 400)
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new APIError('Invalid rating', 422)
    }
    if (comment.length < 10 || comment.length > 2000) {
      throw new APIError('Invalid comment length', 422)
    }

    const reviewKey = `${webProfileId}:${productId}`
    const existing = await req.payload.find({
      collection: 'product-reviews',
      where: { reviewKey: { equals: reviewKey } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (existing.docs.length > 0) {
      throw new APIError('Review already exists for this product', 409)
    }

    try {
      const created = await req.payload.create({
        collection: 'product-reviews',
        data: {
          product: productId,
          skuErp,
          customerId,
          webProfileId,
          authorDisplayName,
          rating,
          comment,
          status: 'pending',
          reviewKey,
        },
        overrideAccess: true,
      })

      return Response.json({
        doc: {
          id: created.id,
          status: created.status,
          rating: created.rating,
          comment: created.comment,
          createdAt: created.createdAt,
        },
      })
    } catch (err) {
      if (err instanceof Error && err.message === 'DUPLICATE_REVIEW') {
        throw new APIError('Review already exists for this product', 409)
      }
      throw err
    }
  },
}

export const productReviewsStorefrontUpdateEndpoint: Endpoint = {
  path: '/storefront-update',
  method: 'patch',
  handler: async (req) => {
    if (!isStorefrontQuoteApiKey(req)) {
      throw new APIError('Unauthorized', 401)
    }

    let body: {
      id?: number
      webProfileId?: string
      authorDisplayName?: string
      rating?: number
      comment?: string
    }
    try {
      body = (await req.json?.()) as typeof body
    } catch {
      throw new APIError('Invalid JSON body', 400)
    }

    const id = body.id
    const webProfileId = body.webProfileId?.trim()
    const authorDisplayName = body.authorDisplayName?.trim()
    const rating = body.rating
    const comment = body.comment?.trim()

    if (!id || !webProfileId || !authorDisplayName || rating == null || !comment) {
      throw new APIError('Missing required fields', 400)
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new APIError('Invalid rating', 422)
    }
    if (comment.length < 10 || comment.length > 2000) {
      throw new APIError('Invalid comment length', 422)
    }

    const existing = await req.payload.findByID({
      collection: 'product-reviews',
      id,
      depth: 0,
      overrideAccess: true,
    })

    if (existing.webProfileId !== webProfileId) {
      throw new APIError('Forbidden', 403)
    }

    const updated = await req.payload.update({
      collection: 'product-reviews',
      id,
      data: {
        rating,
        comment,
        authorDisplayName,
        status: 'pending',
        previousStatus: existing.status !== 'pending' ? existing.status : existing.previousStatus,
      },
      overrideAccess: true,
    })

    return Response.json({
      doc: {
        id: updated.id,
        status: updated.status,
        rating: updated.rating,
        comment: updated.comment,
        previousStatus: updated.previousStatus ?? null,
        updatedAt: updated.updatedAt,
      },
    })
  },
}

export const productReviewsStorefrontListEndpoint: Endpoint = {
  path: '/storefront-list',
  method: 'get',
  handler: async (req) => {
    if (!isStorefrontQuoteApiKey(req)) {
      throw new APIError('Unauthorized', 401)
    }

    const url = new URL(req.url ?? 'http://local', 'http://local')
    const productId = Number.parseInt(url.searchParams.get('productId') ?? '', 10)
    if (!Number.isFinite(productId)) throw new APIError('productId required', 400)

    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1)
    const pageSize = Math.min(
      50,
      Math.max(1, Number.parseInt(url.searchParams.get('pageSize') ?? '10', 10) || 10),
    )

    const found = await req.payload.find({
      collection: 'product-reviews',
      where: {
        and: [{ product: { equals: productId } }, { status: { equals: 'approved' } }],
      },
      sort: '-createdAt',
      page,
      limit: pageSize,
      depth: 0,
      overrideAccess: true,
    })

    return Response.json({
      docs: found.docs.map((d) => ({
        id: d.id,
        rating: d.rating,
        comment: d.comment,
        authorDisplayName: d.authorDisplayName,
        createdAt: d.createdAt,
      })),
      total: found.totalDocs,
      page,
      pageSize,
    })
  },
}

export const productReviewsStorefrontMineEndpoint: Endpoint = {
  path: '/storefront-mine',
  method: 'get',
  handler: async (req) => {
    if (!isStorefrontQuoteApiKey(req)) {
      throw new APIError('Unauthorized', 401)
    }

    const url = new URL(req.url ?? 'http://local', 'http://local')
    const productId = Number.parseInt(url.searchParams.get('productId') ?? '', 10)
    const webProfileId = url.searchParams.get('webProfileId')?.trim()
    if (!Number.isFinite(productId) || !webProfileId) {
      throw new APIError('productId and webProfileId required', 400)
    }

    const found = await req.payload.find({
      collection: 'product-reviews',
      where: {
        and: [
          { product: { equals: productId } },
          { webProfileId: { equals: webProfileId } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (found.docs.length === 0) {
      return Response.json({ doc: null })
    }

    const d = found.docs[0]!
    return Response.json({
      doc: {
        id: d.id,
        status: d.status,
        rating: d.rating,
        comment: d.comment,
        authorDisplayName: d.authorDisplayName,
        rejectionNote: d.rejectionNote ?? null,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      },
    })
  },
}

export const productReviewsInboxSummaryEndpoint: Endpoint = {
  path: '/inbox-summary',
  method: 'get',
  handler: async (req) => {
    requireCatalogStaff(req)

    const query = parseInboxQuery(new URL(req.url ?? 'http://local', 'http://local'))
    const found = await req.payload.find({
      collection: 'product-reviews',
      where: buildInboxWhere(query),
      sort: '-createdAt',
      limit: INBOX_LIMIT,
      depth: 1,
      req,
      overrideAccess: false,
    })

    const docs: ReviewInboxRow[] = found.docs.map((row) => ({
      id: row.id,
      status: row.status ?? null,
      previousStatus: row.previousStatus ?? null,
      productTitle: productTitleFromRelation(row.product),
      skuErp: row.skuErp ?? null,
      rating: row.rating ?? null,
      authorDisplayName: row.authorDisplayName ?? null,
      createdAt: row.createdAt,
      isReedition: row.status === 'pending' && row.previousStatus === 'approved',
      adminUrl: `/admin/collections/product-reviews/${row.id}`,
    }))

    return Response.json({ docs, totalDocs: found.totalDocs })
  },
}

export const productReviewsStatusPatchEndpoint: Endpoint = {
  path: '/:id/status',
  method: 'patch',
  handler: async (req) => {
    requireCatalogStaff(req)

    const id = Number(req.routeParams?.id)
    if (!Number.isFinite(id)) throw new APIError('Invalid review id', 400)

    const body = (await req.json?.()) as { status?: string; rejectionNote?: string | null }
    const next = body.status
    if (!next || !isReviewStatus(next)) {
      throw new APIError('Valid status required', 400)
    }

    const existing = await req.payload.findByID({
      collection: 'product-reviews',
      id,
      depth: 0,
      req,
      overrideAccess: false,
    })

    assertAllowedReviewTransition(existing.status as never, next)

    const data: Record<string, unknown> = { status: next }
    if (next === 'rejected' && body.rejectionNote !== undefined) {
      data.rejectionNote = body.rejectionNote?.trim() || null
    }

    const updated = await req.payload.update({
      collection: 'product-reviews',
      id,
      data,
      req,
      overrideAccess: false,
    })

    return Response.json({ doc: updated })
  },
}

export const productReviewsDeleteEndpoint: Endpoint = {
  path: '/:id',
  method: 'delete',
  handler: async (req) => {
    requireCatalogStaff(req)

    const id = Number(req.routeParams?.id)
    if (!Number.isFinite(id)) throw new APIError('Invalid review id', 400)

    await req.payload.delete({
      collection: 'product-reviews',
      id,
      req,
      overrideAccess: false,
    })

    return Response.json({ ok: true })
  },
}

export const productReviewsEndpoints: Endpoint[] = [
  productReviewsStorefrontCreateEndpoint,
  productReviewsStorefrontUpdateEndpoint,
  productReviewsStorefrontListEndpoint,
  productReviewsStorefrontMineEndpoint,
  productReviewsInboxSummaryEndpoint,
  productReviewsStatusPatchEndpoint,
  productReviewsDeleteEndpoint,
]
