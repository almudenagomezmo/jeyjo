import type { CollectionConfig } from 'payload'

import {
  staffCreateAccess,
  staffDeleteAccess,
  staffReadAccess,
  staffUpdateAccess,
} from '@/access/staffAccess'
import { isCollectionHidden } from '@/access/staffRoles'
import { createAuditHooks } from '@/hooks/auditLogHooks'

import { assignNextQuoteNumber } from './quote-number'
import {
  assertAllowedQuoteTransition,
  isQuoteStatus,
  type QuoteStatus,
} from './status-transitions'

export function isStorefrontQuoteApiKey(req: { headers: Headers }): boolean {
  const expected = process.env.STOREFRONT_PAYLOAD_API_KEY
  if (!expected) return false
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7) === expected
  }
  return req.headers.get('x-jeyjo-storefront-key') === expected
}

const QUOTE_STATUS_OPTIONS = [
  { label: 'Solicitado', value: 'requested' },
  { label: 'En revisión', value: 'in_review' },
  { label: 'Enviado', value: 'sent' },
  { label: 'Aceptado', value: 'accepted' },
  { label: 'Pedido', value: 'ordered' },
  { label: 'Cancelado', value: 'cancelled' },
]

const DELIVERY_METHOD_OPTIONS = [
  { label: 'Envío a domicilio (facturación)', value: 'home' },
  { label: 'Envío a dirección guardada', value: 'alternate_address' },
  { label: 'Recogida Alfaro', value: 'pickup_alfaro' },
  { label: 'Recogida Rincón de Soto', value: 'pickup_rincon' },
]

const quoteAuditHooks = createAuditHooks({ collection: 'quotes' })

export const Quotes: CollectionConfig = {
  slug: 'quotes',
  labels: {
    singular: 'Presupuesto',
    plural: 'Presupuestos',
  },
  access: {
    create: async ({ req }) => {
      if (isStorefrontQuoteApiKey(req)) return true
      return staffCreateAccess('quotes')({ req })
    },
    read: staffReadAccess('quotes'),
    update: async ({ req }) => {
      if (isStorefrontQuoteApiKey(req)) return false
      return staffUpdateAccess('quotes')({ req })
    },
    delete: staffDeleteAccess('quotes'),
  },
  admin: {
    group: 'Pedidos',
    hidden: ({ user }) => isCollectionHidden(user, 'quotes'),
    defaultColumns: ['quoteNumber', 'createdAt', 'status', 'segment', 'amount'],
    description: 'Bandeja operativa: /admin/quotes',
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (!data) return data
        if ((operation === 'create' || !data.quoteNumber) && !data.quoteNumber) {
          data.quoteNumber = await assignNextQuoteNumber(req.payload)
        }
        return data
      },
    ],
    beforeChange: [
      async ({ data, originalDoc, req, operation }) => {
        if (!data) return data
        const nextStatus = (data.status as string | undefined) ?? originalDoc?.status
        const prevStatus = originalDoc?.status as QuoteStatus | undefined

        if (operation === 'update' && nextStatus && nextStatus !== prevStatus) {
          if (
            prevStatus === 'accepted' &&
            nextStatus === 'ordered' &&
            !data.convertedOrderRef
          ) {
            throw new Error('Use convert-to-order endpoint to mark quote as ordered')
          }
          assertAllowedQuoteTransition(prevStatus ?? null, nextStatus)
        }

        if (operation === 'create' && data.status && isQuoteStatus(String(data.status))) {
          assertAllowedQuoteTransition(null, data.status as QuoteStatus)
        }

        return data
      },
    ],
    afterChange: [...quoteAuditHooks.afterChange],
    afterDelete: [...quoteAuditHooks.afterDelete],
  },
  fields: [
    {
      name: 'quoteNumber',
      type: 'text',
      label: 'Número de presupuesto',
      unique: true,
      index: true,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Estado',
      defaultValue: 'requested',
      options: QUOTE_STATUS_OPTIONS,
      admin: { position: 'sidebar' },
    },
    {
      name: 'segment',
      type: 'select',
      label: 'Segmento',
      defaultValue: 'b2c',
      options: [
        { label: 'B2C', value: 'b2c' },
        { label: 'B2B', value: 'b2b' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'customerRef',
      type: 'text',
      label: 'Referencia cliente (UUID)',
      admin: { position: 'sidebar' },
    },
    {
      name: 'guestEmail',
      type: 'email',
      label: 'Email contacto',
      admin: { position: 'sidebar' },
    },
    {
      name: 'amount',
      type: 'number',
      label: 'Importe total',
      admin: { position: 'sidebar' },
    },
    {
      name: 'subtotal',
      type: 'number',
      label: 'Subtotal',
    },
    {
      name: 'shippingCost',
      type: 'number',
      label: 'Coste de envío',
    },
    {
      name: 'deliveryMethod',
      type: 'select',
      label: 'Método de entrega',
      options: DELIVERY_METHOD_OPTIONS,
      admin: { position: 'sidebar' },
    },
    {
      name: 'pickupStoreLabel',
      type: 'text',
      label: 'Tienda de recogida',
      admin: { position: 'sidebar' },
    },
    {
      name: 'shippingAddressSnapshot',
      type: 'json',
      label: 'Dirección de envío (snapshot)',
    },
    {
      name: 'billingAddressSnapshot',
      type: 'json',
      label: 'Dirección de facturación (snapshot)',
    },
    {
      name: 'customerNotes',
      type: 'textarea',
      label: 'Observaciones del cliente',
      maxLength: 500,
    },
    {
      name: 'lineSnapshots',
      type: 'json',
      label: 'Líneas (snapshot)',
    },
    {
      name: 'validUntil',
      type: 'date',
      label: 'Válido hasta',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly' },
      },
    },
    {
      name: 'emailSentAt',
      type: 'date',
      label: 'Email confirmación enviado',
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'convertedOrderRef',
      type: 'relationship',
      relationTo: 'orders',
      label: 'Pedido convertido',
      admin: { position: 'sidebar' },
    },
  ],
}
