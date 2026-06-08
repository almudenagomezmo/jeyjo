import type { Endpoint } from 'payload'

import { isStorefrontQuoteApiKey } from '@/collections/Quotes'

function unauthorized(): Response {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}

export const customerDocumentsEndpoints: Endpoint[] = [
  {
    path: '/customer-documents/list',
    method: 'get',
    handler: async (req) => {
      if (!isStorefrontQuoteApiKey(req)) return unauthorized()

      const customerId = req.query?.customerId
      const documentType = req.query?.documentType
      if (typeof customerId !== 'string' || !customerId.trim()) {
        return Response.json({ error: 'customerId required' }, { status: 400 })
      }

      const where: Record<string, unknown> = {
        customerId: { equals: customerId.trim() },
      }
      if (typeof documentType === 'string' && documentType.trim()) {
        where.documentType = { equals: documentType.trim() }
      }

      const found = await req.payload.find({
        collection: 'customer-documents',
        where,
        limit: 500,
        depth: 0,
        sort: '-issuedAt',
        overrideAccess: true,
        req,
      })

      return Response.json({ docs: found.docs })
    },
  },
  {
    path: '/customer-documents/:id',
    method: 'get',
    handler: async (req) => {
      if (!isStorefrontQuoteApiKey(req)) return unauthorized()

      const id = req.routeParams?.id
      if (!id) return Response.json({ error: 'id required' }, { status: 400 })

      try {
        const doc = await req.payload.findByID({
          collection: 'customer-documents',
          id,
          depth: 0,
          overrideAccess: true,
          req,
        })
        return Response.json(doc)
      } catch {
        return Response.json({ error: 'Not found' }, { status: 404 })
      }
    },
  },
]
