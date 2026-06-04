import { APIError, type Endpoint } from 'payload'

import { staffUpdateAccess } from '@/access/staffAccess'

const MAX_IDS = 500
const DEFAULT_TEMPLATE = '{title} - Compra online al mejor precio en Jeyjo'
const META_DESC_MAX = 160

type BulkSeoBody = {
  ids?: Array<string | number>
  allPublished?: boolean
  template?: string
  emptyOnly?: boolean
  updateMetaTitle?: boolean
}

function applyTemplate(template: string, title: string): string {
  return template.replace(/\{title\}/g, title).trim().slice(0, META_DESC_MAX)
}

function metaDescriptionEmpty(doc: {
  metaDescription?: string | null
  meta?: { description?: string | null } | null
}): boolean {
  const legacy = doc.metaDescription?.trim()
  const plugin = doc.meta?.description?.trim()
  return !legacy && !plugin
}

function metaTitleEmpty(doc: { meta?: { title?: string | null } | null }): boolean {
  return !doc.meta?.title?.trim()
}

export const bulkSeoTemplateEndpoint: Endpoint = {
  path: '/products/bulk-seo-template',
  method: 'post',
  handler: async (req) => {
    const allowed = await staffUpdateAccess('products')({ req })
    if (!allowed) {
      if (!req.user) throw new APIError('Unauthorized', 401)
      throw new APIError('Forbidden', 403)
    }

    let body: BulkSeoBody = {}
    try {
      body = (await req.json?.()) as BulkSeoBody
    } catch {
      throw new APIError('Invalid JSON body', 400)
    }

    const template = (body.template?.trim() || DEFAULT_TEMPLATE).slice(0, 500)
    const emptyOnly = body.emptyOnly === true
    const updateMetaTitle = body.updateMetaTitle === true

    let ids: Array<string | number> = []
    if (body.allPublished) {
      const found = await req.payload.find({
        collection: 'products',
        where: { _status: { equals: 'published' } },
        limit: MAX_IDS,
        depth: 0,
        req,
        overrideAccess: true,
      })
      ids = found.docs.map((d) => d.id)
    } else if (Array.isArray(body.ids) && body.ids.length > 0) {
      ids = body.ids.slice(0, MAX_IDS)
    } else {
      throw new APIError('Provide ids[] or allPublished', 400)
    }

    let updated = 0
    let skipped = 0

    for (const id of ids) {
      const doc = await req.payload.findByID({
        collection: 'products',
        id,
        depth: 0,
        req,
        overrideAccess: true,
      })

      const title = String(doc.title ?? '').trim() || String(doc.skuErp ?? id)
      const description = applyTemplate(template, title)

      const patch: Record<string, unknown> = {}
      const metaPatch: Record<string, string> = {}

      const descEmpty = metaDescriptionEmpty(doc)
      if (!emptyOnly || descEmpty) {
        if (!emptyOnly || !doc.metaDescription?.trim()) {
          patch.metaDescription = description
        }
        if (!emptyOnly || !doc.meta?.description?.trim()) {
          metaPatch.description = description
        }
      }

      if (updateMetaTitle && (!emptyOnly || metaTitleEmpty(doc))) {
        metaPatch.title = title.slice(0, 60)
      }

      if (Object.keys(metaPatch).length > 0) {
        patch.meta = { ...(doc.meta ?? {}), ...metaPatch }
      }

      if (Object.keys(patch).length === 0) {
        skipped += 1
        continue
      }

      await req.payload.update({
        collection: 'products',
        id,
        data: patch,
        depth: 0,
        req,
        overrideAccess: true,
      })
      updated += 1
    }

    return Response.json({ updated, skipped, total: ids.length })
  },
}
