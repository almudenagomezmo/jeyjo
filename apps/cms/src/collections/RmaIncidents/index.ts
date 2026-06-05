import type { CollectionConfig } from 'payload'

import {
  staffCreateAccess,
  staffDeleteAccess,
  staffReadAccess,
  staffUpdateAccess,
} from '@/access/staffAccess'
import { isCollectionHidden } from '@/access/staffRoles'
import { isStorefrontQuoteApiKey } from '@/collections/Quotes'
import { createAuditHooks } from '@/hooks/auditLogHooks'
import { rmaOmsEndpoints } from '@/endpoints/rma-oms'

import { assignNextRmaNumber } from './rma-number'
import {
  assertAllowedRmaTransition,
  isRmaStatus,
  type RmaStatus,
} from './status-transitions'

const RMA_STATUS_OPTIONS = [
  { label: 'Solicitada', value: 'requested' },
  { label: 'En revisión', value: 'in_review' },
  { label: 'Autorizada', value: 'authorized' },
  { label: 'Rechazada', value: 'rejected' },
]

const RMA_REASON_OPTIONS = [
  { label: 'Artículo incorrecto', value: 'wrong_item' },
  { label: 'Artículo defectuoso', value: 'defective' },
  { label: 'Cantidad incorrecta', value: 'wrong_qty' },
  { label: 'Otro', value: 'other' },
]

const rmaAuditHooks = createAuditHooks({ collection: 'rma-incidents' })

export const RmaIncidents: CollectionConfig = {
  slug: 'rma-incidents',
  labels: {
    singular: 'Incidencia RMA',
    plural: 'Incidencias RMA',
  },
  access: {
    create: async ({ req }) => {
      if (isStorefrontQuoteApiKey(req)) return true
      return staffCreateAccess('rma-incidents')({ req })
    },
    read: staffReadAccess('rma-incidents'),
    update: async ({ req }) => {
      if (isStorefrontQuoteApiKey(req)) return false
      return staffUpdateAccess('rma-incidents')({ req })
    },
    delete: staffDeleteAccess('rma-incidents'),
  },
  admin: {
    group: 'Pedidos',
    hidden: ({ user }) => isCollectionHidden(user, 'rma-incidents'),
    defaultColumns: [
      'rmaNumber',
      'createdAt',
      'status',
      'articleSku',
      'deliveryNoteNumber',
      'customerRef',
    ],
    description: 'Bandeja operativa: /admin/rma',
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (!data) return data
        if ((operation === 'create' || !data.rmaNumber) && !data.rmaNumber) {
          data.rmaNumber = await assignNextRmaNumber(req.payload)
        }
        return data
      },
    ],
    beforeChange: [
      async ({ data, originalDoc, req, operation }) => {
        if (!data) return data
        const nextStatus = (data.status as string | undefined) ?? originalDoc?.status
        const prevStatus = originalDoc?.status as RmaStatus | undefined

        if (operation === 'update' && nextStatus && nextStatus !== prevStatus) {
          assertAllowedRmaTransition(prevStatus ?? null, nextStatus)
        }

        if (operation === 'create' && data.status && isRmaStatus(String(data.status))) {
          assertAllowedRmaTransition(null, data.status as RmaStatus)
        }

        return data
      },
    ],
    afterChange: [...rmaAuditHooks.afterChange],
    afterDelete: [...rmaAuditHooks.afterDelete],
  },
  endpoints: rmaOmsEndpoints,
  fields: [
    {
      name: 'rmaNumber',
      type: 'text',
      label: 'Número RMA',
      unique: true,
      index: true,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Estado',
      defaultValue: 'requested',
      options: RMA_STATUS_OPTIONS,
      admin: { position: 'sidebar' },
    },
    {
      name: 'customerRef',
      type: 'text',
      label: 'Referencia cliente (UUID)',
      required: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'articleSku',
      type: 'text',
      label: 'Referencia artículo',
      required: true,
    },
    {
      name: 'deliveryNoteNumber',
      type: 'text',
      label: 'Número de albarán',
      required: true,
    },
    {
      name: 'reason',
      type: 'select',
      label: 'Motivo',
      required: true,
      options: RMA_REASON_OPTIONS,
    },
    {
      name: 'observations',
      type: 'textarea',
      label: 'Observaciones',
      maxLength: 2000,
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
  ],
}
