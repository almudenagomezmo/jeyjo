import type { Field } from 'payload'
import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'

import {
  applyIvaSnapshotToOrderLines,
  isOrderConfirming,
  mergeOrderItemIvaSnapshotField,
  type OrderLineForIva,
} from '@/collections/Orders/iva-snapshot'
import {
  assertAllowedStatusTransition,
  isJeyjoOrderStatus,
  type JeyjoOrderStatus,
} from '@/collections/Orders/status-transitions'
import { createAuditHooks } from '@/hooks/auditLogHooks'
import { incrementCouponUsage } from '@/lib/coupons/increment-usage-hook'
import { notifyOrderStatusChange } from '@/lib/notifications/order-status-hook'
import {
  staffCreateAccess,
  staffDeleteAccess,
  staffReadAccess,
  staffUpdateAccess,
} from '@/access/staffAccess'
import { isCollectionHidden } from '@/access/staffRoles'

const JEYJO_ORDER_STATUSES = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'Pendiente de pago', value: 'pending_payment' },
  { label: 'Pendiente aprobación empresa', value: 'pending_company_approval' },
  { label: 'Pendiente de confirmación', value: 'pending_confirmation' },
  { label: 'Confirmado', value: 'confirmed' },
  { label: 'En preparación', value: 'preparing' },
  { label: 'Enviado', value: 'shipped' },
  { label: 'Entregado', value: 'delivered' },
  { label: 'Cancelado', value: 'cancelled' },
]

const DELIVERY_METHOD_OPTIONS = [
  { label: 'Envío a domicilio (facturación)', value: 'home' },
  { label: 'Envío a dirección guardada', value: 'alternate_address' },
  { label: 'Recogida Alfaro', value: 'pickup_alfaro' },
  { label: 'Recogida Rincón de Soto', value: 'pickup_rincon' },
]

function isStorefrontOrderApiKey(req: { headers: Headers }): boolean {
  const expected = process.env.STOREFRONT_PAYLOAD_API_KEY
  if (!expected) return false
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7) === expected
  }
  return req.headers.get('x-jeyjo-storefront-key') === expected
}

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
    name: 'submittedByUserId',
    type: 'text',
    label: 'Subusuario (UUID)',
    admin: {
      position: 'sidebar',
      description: 'web_profiles.id del subusuario que envió el pedido',
    },
  },
  {
    name: 'submittedByEmail',
    type: 'text',
    label: 'Email subusuario',
    admin: { position: 'sidebar' },
  },
  {
    name: 'validatedEva',
    type: 'checkbox',
    label: 'Validado EVA',
    defaultValue: false,
    admin: { position: 'sidebar' },
  },
  {
    name: 'stockValidationPending',
    type: 'checkbox',
    label: 'Validación de stock pendiente',
    defaultValue: false,
    admin: { position: 'sidebar' },
  },
  {
    name: 'exportedToErpAt',
    type: 'date',
    label: 'Exportado a ERP',
    admin: {
      position: 'sidebar',
      date: { pickerAppearance: 'dayAndTime' },
      readOnly: true,
    },
  },
  {
    name: 'evaRejectionReason',
    type: 'textarea',
    label: 'Motivo rechazo EVA',
    admin: {
      condition: (data) => data?.origin === 'eva',
    },
  },
  {
    name: 'deliveryMethod',
    type: 'select',
    label: 'Método de entrega',
    options: DELIVERY_METHOD_OPTIONS,
    admin: { position: 'sidebar' },
  },
  {
    name: 'shippingCost',
    type: 'number',
    label: 'Coste de envío',
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
    name: 'couponCode',
    type: 'text',
    label: 'Cupón',
    admin: { position: 'sidebar' },
  },
  {
    name: 'couponUsageRecorded',
    type: 'checkbox',
    label: 'Uso de cupón registrado',
    defaultValue: false,
    admin: {
      position: 'sidebar',
      readOnly: true,
      condition: (data) => Boolean(data?.couponCode),
    },
  },
  {
    name: 'customerNotes',
    type: 'textarea',
    label: 'Observaciones del cliente',
    maxLength: 500,
  },
  {
    name: 'guestEmail',
    type: 'email',
    label: 'Email invitado',
    admin: { position: 'sidebar' },
  },
  {
    name: 'paymentMethodCode',
    type: 'text',
    label: 'Código forma de pago',
    admin: { position: 'sidebar' },
  },
  {
    name: 'paymentMethodLabel',
    type: 'text',
    label: 'Forma de pago',
    admin: { position: 'sidebar' },
  },
  {
    type: 'collapsible',
    label: 'Pago',
    admin: { initCollapsed: false },
    fields: [
      {
        name: 'paymentStatus',
        type: 'select',
        label: 'Estado del pago',
        defaultValue: 'pending',
        options: [
          { label: 'Pendiente', value: 'pending' },
          { label: 'Autorizado', value: 'authorized' },
          { label: 'Fallido', value: 'failed' },
          { label: 'Cancelado', value: 'cancelled' },
        ],
      },
      {
        name: 'gateway',
        type: 'select',
        label: 'Pasarela',
        options: [
          { label: 'Redsys', value: 'redsys' },
          { label: 'PayPal', value: 'paypal' },
          { label: 'Transferencia', value: 'transfer' },
          { label: 'ERP / condiciones', value: 'erp' },
        ],
      },
      {
        name: 'gatewayTransactionId',
        type: 'text',
        label: 'ID transacción pasarela',
      },
      {
        name: 'gatewayAuthCode',
        type: 'text',
        label: 'Código autorización',
      },
      {
        name: 'paidAmount',
        type: 'number',
        label: 'Importe cobrado',
      },
      {
        name: 'paidAt',
        type: 'date',
        label: 'Fecha de cobro',
        admin: { date: { pickerAppearance: 'dayAndTime' } },
      },
      {
        name: 'paymentFailureReason',
        type: 'text',
        label: 'Motivo fallo de pago',
      },
    ],
  },
  {
    name: 'orderLineSnapshots',
    type: 'json',
    label: 'Líneas (snapshot checkout)',
    admin: { description: 'SKU, cantidades y precios al confirmar desde storefront' },
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
    create: async ({ req }) => {
      if (isStorefrontOrderApiKey(req)) return true
      return staffCreateAccess('orders')({ req })
    },
    read: staffReadAccess('orders'),
    update: async ({ req }) => {
      if (isStorefrontOrderApiKey(req)) return true
      return staffUpdateAccess('orders')({ req })
    },
    delete: staffDeleteAccess('orders'),
  },
  admin: {
    ...defaultCollection?.admin,
    group: 'Pedidos',
    hidden: ({ user }) => isCollectionHidden(user, 'orders'),
    defaultColumns: ['orderNumber', 'createdAt', 'origin', 'jeyjoStatus', 'amount'],
    description: 'Bandeja operativa OMS: /admin/oms',
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
      async ({ data, originalDoc, req, operation }) => {
        if (!data) return data
        const nextStatus = (data.jeyjoStatus as string | undefined) ?? originalDoc?.jeyjoStatus
        const prevStatus = originalDoc?.jeyjoStatus as JeyjoOrderStatus | undefined
        const items = data.items as OrderLineForIva[] | undefined

        if (operation === 'update' && nextStatus && nextStatus !== prevStatus) {
          assertAllowedStatusTransition(prevStatus ?? null, nextStatus, {
            storefrontApi: isStorefrontOrderApiKey(req),
          })
        }

        if (
          operation === 'create' &&
          data.jeyjoStatus &&
          isJeyjoOrderStatus(String(data.jeyjoStatus))
        ) {
          assertAllowedStatusTransition(null, data.jeyjoStatus as JeyjoOrderStatus, {
            storefrontApi: isStorefrontOrderApiKey(req),
          })
        }

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
      notifyOrderStatusChange,
      incrementCouponUsage,
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
