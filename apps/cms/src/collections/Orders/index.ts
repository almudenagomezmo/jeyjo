import type { Field } from 'payload'
import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'

import {
  applyIvaSnapshotToOrderLines,
  isOrderConfirming,
  mergeOrderItemIvaSnapshotField,
  type OrderLineForIva,
} from '@/collections/Orders/iva-snapshot'
import { createAuditHooks } from '@/hooks/auditLogHooks'
import {
  staffCreateAccess,
  staffDeleteAccess,
  staffReadAccess,
  staffUpdateAccess,
} from '@/access/staffAccess'
import { isCollectionHidden } from '@/access/staffRoles'

const JEYJO_ORDER_STATUSES = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'Confirmado', value: 'confirmed' },
  { label: 'En preparación', value: 'preparing' },
  { label: 'Enviado', value: 'shipped' },
  { label: 'Entregado', value: 'delivered' },
  { label: 'Cancelado', value: 'cancelled' },
]

const jeyjoOrderFields: Field[] = [
  {
    name: 'orderNumber',
    type: 'text',
    label: 'Número de pedido',
    unique: true,
    index: true,
    admin: { position: 'sidebar' },
  },
  {
    name: 'origin',
    type: 'select',
    label: 'Origen',
    defaultValue: 'b2c',
    options: [
      { label: 'Web B2C', value: 'b2c' },
      { label: 'Intranet B2B', value: 'b2b' },
      { label: 'EVA', value: 'eva' },
    ],
    admin: { position: 'sidebar' },
  },
  {
    name: 'jeyjoStatus',
    type: 'select',
    label: 'Estado Jeyjo',
    defaultValue: 'pending',
    options: JEYJO_ORDER_STATUSES,
    admin: { position: 'sidebar' },
  },
  {
    name: 'customerRef',
    type: 'text',
    label: 'Referencia cliente (UUID)',
    admin: {
      position: 'sidebar',
      description: 'UUID de public.customers hasta enlace formal en #16',
    },
  },
  {
    name: 'validatedEva',
    type: 'checkbox',
    label: 'Validado EVA',
    defaultValue: false,
    admin: { position: 'sidebar' },
  },
  {
    name: 'accessToken',
    type: 'text',
    unique: true,
    index: true,
    admin: {
      position: 'sidebar',
      readOnly: true,
    },
    hooks: {
      beforeValidate: [
        ({ value, operation }) => {
          if (operation === 'create' || !value) {
            return crypto.randomUUID()
          }
          return value
        },
      ],
    },
  },
]

const orderAuditHooks = createAuditHooks({ collection: 'orders' })

export const OrdersCollectionOverride: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  labels: {
    singular: 'Pedido',
    plural: 'Pedidos',
  },
  access: {
    ...defaultCollection?.access,
    create: staffCreateAccess('orders'),
    read: staffReadAccess('orders'),
    update: staffUpdateAccess('orders'),
    delete: staffDeleteAccess('orders'),
  },
  admin: {
    ...defaultCollection?.admin,
    group: 'Pedidos',
    hidden: ({ user }) => isCollectionHidden(user, 'orders'),
    defaultColumns: ['orderNumber', 'createdAt', 'origin', 'jeyjoStatus', 'total'],
  },
  hooks: {
    ...defaultCollection?.hooks,
    beforeValidate: [
      ...(defaultCollection?.hooks?.beforeValidate ?? []),
      ({ data, operation }) => {
        if (!data) return data
        if ((operation === 'create' || !data.orderNumber) && !data.orderNumber) {
          const ts = Date.now().toString(36).toUpperCase()
          data.orderNumber = `JW-${ts}`
        }
        return data
      },
    ],
    beforeChange: [
      ...(defaultCollection?.hooks?.beforeChange ?? []),
      async ({ data, originalDoc, req }) => {
        if (!data) return data
        const nextStatus = (data.jeyjoStatus as string | undefined) ?? originalDoc?.jeyjoStatus
        const prevStatus = originalDoc?.jeyjoStatus
        const items = data.items as OrderLineForIva[] | undefined

        if (isOrderConfirming(nextStatus, prevStatus)) {
          await applyIvaSnapshotToOrderLines({
            items,
            payload: req.payload,
            requireAll: true,
          })
        }

        return data
      },
    ],
    afterChange: [
      ...(defaultCollection?.hooks?.afterChange ?? []),
      ...orderAuditHooks.afterChange,
    ],
    afterDelete: [
      ...(defaultCollection?.hooks?.afterDelete ?? []),
      ...orderAuditHooks.afterDelete,
    ],
  },
  fields: [
    ...jeyjoOrderFields,
    ...mergeOrderItemIvaSnapshotField(defaultCollection.fields),
  ],
})
