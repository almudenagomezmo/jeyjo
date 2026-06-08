import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
} from 'payload'

import { extractSourceIp } from '@/lib/request-ip'
import { writeAuditLog } from '@/lib/supabase-server'

const ENTITY_TYPE_BY_COLLECTION: Record<string, string> = {
  products: 'product',
  categories: 'category',
  brands: 'brand',
  suppliers: 'supplier',
  orders: 'order',
  users: 'user',
  media: 'media',
}

const DEFAULT_PICK_FIELDS: Record<string, string[]> = {
  products: ['title', 'slug', 'p1Price', 'p2Price', 'skuErp'],
  categories: ['title', 'slug', 'parent'],
  brands: ['name', 'slug'],
  suppliers: ['name', 'code'],
  orders: ['orderNumber', 'origin', 'jeyjoStatus', 'total'],
  users: ['email', 'name', 'staffRoles', 'twoFactorEnabled'],
  media: ['alt', 'filename'],
}

export type AuditedCollection = keyof typeof ENTITY_TYPE_BY_COLLECTION

type AuditHookOptions = {
  collection: AuditedCollection
  entityType?: string
  pickFields?: string[]
  /** Release the request pool connection before writing audit_log (orders). */
  deferWrites?: boolean
}

function pickSnapshot(doc: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of fields) {
    if (key in doc) out[key] = doc[key]
  }
  return out
}

function actorFromReq(req: {
  user?: { id?: number | string; email?: string; name?: string | null } | null
}) {
  return {
    actorId: req.user?.id ?? null,
    actorName: req.user?.email ?? req.user?.name ?? null,
  }
}

export function createAuditHooks(options: AuditHookOptions) {
  const entityType = options.entityType ?? ENTITY_TYPE_BY_COLLECTION[options.collection]
  const pickFields = options.pickFields ?? DEFAULT_PICK_FIELDS[options.collection] ?? ['title', 'slug']

  const beforeChange: CollectionBeforeChangeHook[] = [
    ({ data, operation, originalDoc, context }) => {
      if (operation === 'update' && originalDoc) {
        context.auditPrevious = pickSnapshot(
          originalDoc as Record<string, unknown>,
          pickFields,
        )
      }
      return data
    },
  ]

  const afterChange: CollectionAfterChangeHook[] = [
    async ({ doc, operation, req, context }) => {
      if (!doc?.id) return doc
      if (req.context?.seedCatalog === true) return doc

      const { actorId, actorName } = actorFromReq(req)
      const current = pickSnapshot(doc as Record<string, unknown>, pickFields)
      const previous =
        operation === 'update'
          ? (context.auditPrevious as Record<string, unknown> | undefined)
          : undefined

      const write = async () => {
        try {
          await writeAuditLog({
            actorId,
            actorName,
            entityType,
            entityId: doc.id,
            action: operation === 'create' ? 'create' : 'update',
            metadata: current,
            previousValue: previous ?? null,
            sourceIp: extractSourceIp(req.headers),
          })
        } catch (error) {
          req.payload.logger.error(
            { err: error, collection: options.collection, id: doc.id },
            'Failed to write audit log',
          )
        }
      }

      if (options.deferWrites) {
        queueMicrotask(() => {
          void write()
        })
        return doc
      }

      await write()
      return doc
    },
  ]

  const afterDelete: CollectionAfterDeleteHook[] = [
    async ({ doc, req }) => {
      if (!doc?.id) return doc

      try {
        const { actorId, actorName } = actorFromReq(req)
        await writeAuditLog({
          actorId,
          actorName,
          entityType,
          entityId: doc.id,
          action: 'delete',
          metadata: pickSnapshot(doc as Record<string, unknown>, pickFields),
          sourceIp: extractSourceIp(req.headers),
        })
      } catch (error) {
        req.payload.logger.error(
          { err: error, collection: options.collection, id: doc.id },
          'Failed to write audit log on delete',
        )
      }

      return doc
    },
  ]

  return { beforeChange, afterChange, afterDelete }
}

/** @deprecated Use createAuditHooks */
export function auditLogHooksForCollection(collectionSlug: AuditedCollection) {
  return createAuditHooks({ collection: collectionSlug })
}
