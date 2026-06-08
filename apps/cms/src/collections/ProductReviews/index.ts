import type { CollectionConfig } from 'payload'

import {
  staffDeleteAccess,
  staffReadAccess,
  staffUpdateAccess,
} from '@/access/staffAccess'
import { isCollectionHidden } from '@/access/staffRoles'
import { isStorefrontQuoteApiKey } from '@/collections/Quotes'
import { productReviewsEndpoints } from '@/endpoints/product-reviews-oms'
import { createAuditHooks } from '@/hooks/auditLogHooks'

import { recalculateProductReviewAggregates } from './recalculate-aggregates'
import {
  assertAllowedReviewTransition,
  isReviewStatus,
  type ReviewStatus,
} from './status-transitions'

const REVIEW_STATUS_OPTIONS = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'Aprobada', value: 'approved' },
  { label: 'Rechazada', value: 'rejected' },
]

const reviewAuditHooks = createAuditHooks({
  collection: 'products',
  entityType: 'product_review',
  pickFields: ['status', 'rating', 'skuErp', 'authorDisplayName', 'product'],
})

function productIdFromRelation(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const n = Number.parseInt(value, 10)
    return Number.isFinite(n) ? n : null
  }
  if (typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: number | string }).id
    if (typeof id === 'number') return id
    if (typeof id === 'string') {
      const n = Number.parseInt(id, 10)
      return Number.isFinite(n) ? n : null
    }
  }
  return null
}

export const ProductReviews: CollectionConfig = {
  slug: 'product-reviews',
  labels: {
    singular: 'Valoración de producto',
    plural: 'Valoraciones de productos',
  },
  access: {
    create: async ({ req }) => isStorefrontQuoteApiKey(req),
    read: staffReadAccess('product-reviews'),
    update: async ({ req }) => {
      if (isStorefrontQuoteApiKey(req)) return true
      return staffUpdateAccess('product-reviews')({ req })
    },
    delete: staffDeleteAccess('product-reviews'),
  },
  admin: {
    group: 'Catálogo',
    hidden: ({ user }) => isCollectionHidden(user, 'product-reviews'),
    defaultColumns: [
      'status',
      'product',
      'skuErp',
      'rating',
      'authorDisplayName',
      'createdAt',
    ],
    description: 'Bandeja operativa: /admin/product-reviews',
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (!data) return data

        const webProfileId = data.webProfileId?.trim()
        const productId = productIdFromRelation(data.product)
        if (webProfileId && productId != null) {
          data.reviewKey = `${webProfileId}:${productId}`
        }

        if (operation === 'create' && isStorefrontQuoteApiKey(req) && productId != null) {
          const existing = await req.payload.find({
            collection: 'product-reviews',
            where: { reviewKey: { equals: data.reviewKey } },
            limit: 1,
            depth: 0,
            overrideAccess: true,
          })
          if (existing.docs.length > 0) {
            throw new Error('DUPLICATE_REVIEW')
          }
        }

        return data
      },
    ],
    beforeChange: [
      async ({ data, originalDoc, req, operation }) => {
        if (!data) return data

        if (isStorefrontQuoteApiKey(req)) {
          data.status = 'pending'
          if (
            operation === 'update' &&
            originalDoc?.status &&
            originalDoc.status !== 'pending'
          ) {
            data.previousStatus = originalDoc.status
          }
          return data
        }

        const nextStatus = (data.status as string | undefined) ?? originalDoc?.status
        const prevStatus = originalDoc?.status as ReviewStatus | undefined

        if (operation === 'update' && nextStatus && nextStatus !== prevStatus) {
          assertAllowedReviewTransition(prevStatus ?? null, nextStatus)
          if (isReviewStatus(nextStatus) && (nextStatus === 'approved' || nextStatus === 'rejected')) {
            data.moderatedAt = new Date().toISOString()
            if (req.user?.id) {
              data.moderatedBy = req.user.id
            }
          }
        }

        if (operation === 'create' && data.status && isReviewStatus(String(data.status))) {
          assertAllowedReviewTransition(null, data.status as ReviewStatus)
        }

        return data
      },
    ],
    afterChange: [
      ...reviewAuditHooks.afterChange,
      async ({ doc, previousDoc, req }) => {
        const productId = productIdFromRelation(doc.product)
        if (productId == null) return doc

        const statusChanged = previousDoc?.status !== doc.status
        const ratingChanged = previousDoc?.rating !== doc.rating
        if (statusChanged || ratingChanged || !previousDoc) {
          await recalculateProductReviewAggregates(req.payload, productId)
        }
        return doc
      },
    ],
    afterDelete: [
      ...reviewAuditHooks.afterDelete,
      async ({ doc, req }) => {
        const productId = productIdFromRelation(doc.product)
        if (productId != null) {
          await recalculateProductReviewAggregates(req.payload, productId)
        }
        return doc
      },
    ],
  },
  endpoints: productReviewsEndpoints,
  fields: [
    {
      name: 'reviewKey',
      type: 'text',
      label: 'Clave única',
      unique: true,
      index: true,
      admin: { hidden: true, readOnly: true },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Estado',
      defaultValue: 'pending',
      options: REVIEW_STATUS_OPTIONS,
      admin: { position: 'sidebar' },
    },
    {
      name: 'previousStatus',
      type: 'select',
      label: 'Estado anterior',
      options: REVIEW_STATUS_OPTIONS,
      admin: { position: 'sidebar', readOnly: true, condition: (data) => data?.previousStatus },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      label: 'Producto',
      required: true,
      index: true,
    },
    {
      name: 'skuErp',
      type: 'text',
      label: 'SKU',
      required: true,
      index: true,
    },
    {
      name: 'customerId',
      type: 'text',
      label: 'Cliente (UUID)',
      required: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'webProfileId',
      type: 'text',
      label: 'Perfil web (auth uid)',
      required: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'authorDisplayName',
      type: 'text',
      label: 'Nombre del autor',
      required: true,
    },
    {
      name: 'rating',
      type: 'number',
      label: 'Valoración',
      required: true,
      min: 1,
      max: 5,
    },
    {
      name: 'comment',
      type: 'textarea',
      label: 'Comentario',
      required: true,
      maxLength: 2000,
    },
    {
      name: 'rejectionNote',
      type: 'textarea',
      label: 'Nota de rechazo (solo staff)',
      maxLength: 1000,
      admin: {
        position: 'sidebar',
        condition: (data) => data?.status === 'rejected',
      },
    },
    {
      name: 'moderatedBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Moderado por',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'moderatedAt',
      type: 'date',
      label: 'Fecha de moderación',
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
  ],
}
