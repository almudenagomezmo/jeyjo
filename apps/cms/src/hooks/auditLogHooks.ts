import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { writeAuditLog } from '@/lib/supabase-server'

const AUDITED = ['products', 'categories', 'suppliers', 'orders'] as const

type AuditedCollection = (typeof AUDITED)[number]

function entityTypeForCollection(slug: AuditedCollection): string {
  const map: Record<AuditedCollection, string> = {
    products: 'product',
    categories: 'category',
    suppliers: 'supplier',
    orders: 'order',
  }
  return map[slug]
}

function actorFromReq(req: {
  user?: { id?: number | string; email?: string; name?: string | null } | null
}) {
  return {
    actorId: req.user?.id ?? null,
    actorName: req.user?.email ?? req.user?.name ?? null,
  }
}

export function createAuditLogAfterChangeHook(
  collectionSlug: AuditedCollection,
): CollectionAfterChangeHook {
  return async ({ doc, operation, req }) => {
    if (!doc?.id) return doc

    try {
      const { actorId, actorName } = actorFromReq(req)
      await writeAuditLog({
        actorId,
        actorName,
        entityType: entityTypeForCollection(collectionSlug),
        entityId: doc.id,
        action: operation === 'create' ? 'create' : 'update',
        metadata: {
          title: doc.title ?? doc.name ?? doc.orderNumber,
          slug: doc.slug,
        },
      })
    } catch (error) {
      req.payload.logger.error(
        { err: error, collection: collectionSlug, id: doc.id },
        'Failed to write audit log',
      )
    }

    return doc
  }
}

export function createAuditLogAfterDeleteHook(
  collectionSlug: AuditedCollection,
): CollectionAfterDeleteHook {
  return async ({ doc, req }) => {
    if (!doc?.id) return doc

    try {
      const { actorId, actorName } = actorFromReq(req)
      await writeAuditLog({
        actorId,
        actorName,
        entityType: entityTypeForCollection(collectionSlug),
        entityId: doc.id,
        action: 'delete',
        metadata: {
          title: doc.title ?? doc.name ?? doc.orderNumber,
        },
      })
    } catch (error) {
      req.payload.logger.error(
        { err: error, collection: collectionSlug, id: doc.id },
        'Failed to write audit log on delete',
      )
    }

    return doc
  }
}

export function auditLogHooksForCollection(collectionSlug: AuditedCollection) {
  return {
    afterChange: [createAuditLogAfterChangeHook(collectionSlug)],
    afterDelete: [createAuditLogAfterDeleteHook(collectionSlug)],
  }
}
