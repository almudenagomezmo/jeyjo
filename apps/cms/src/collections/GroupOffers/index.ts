import type { CollectionConfig } from 'payload'

import {
  staffCreateAccess,
  staffDeleteAccess,
  staffReadAccess,
  staffUpdateAccess,
} from '@/access/staffAccess'
import { hasStaffRole, isCollectionHidden } from '@/access/staffRoles'
import { createAuditHooks } from '@/hooks/auditLogHooks'
import {
  mirrorGroupOfferToSupabase,
  removeGroupOfferFromSupabase,
} from '@/collections/GroupOffers/supabase-mirror'

const auditHooks = createAuditHooks({ collection: 'group-offers' })

const CUSTOMER_GROUP_OPTIONS = [
  { label: 'Todos los grupos', value: '' },
  { label: 'Grupo 1', value: '1' },
  { label: 'Grupo 2', value: '2' },
  { label: 'Grupo 3', value: '3' },
  { label: 'Grupo 4', value: '4' },
]

export const GroupOffers: CollectionConfig = {
  slug: 'group-offers',
  /** Avoid collision with Supabase `public.group_offers` (UUID pricing table). */
  dbName: 'cms_group_offers',
  labels: {
    singular: 'Oferta de grupo',
    plural: 'Ofertas de grupo',
  },
  access: {
    create: staffCreateAccess('group-offers'),
    read: staffReadAccess('group-offers'),
    update: staffUpdateAccess('group-offers'),
    delete: staffDeleteAccess('group-offers'),
  },
  admin: {
    group: 'Clientes B2B',
    useAsTitle: 'productSku',
    defaultColumns: ['productSku', 'customerGroup', 'offerNetPrice', 'active'],
    hidden: ({ user }) => isCollectionHidden(user, 'group-offers'),
  },
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        if (!data || typeof data !== 'object') return data
        const sku = String(data.productSku ?? '').trim()
        if (!sku) throw new Error('productSku es obligatorio')

        const user = req.user
        if (!hasStaffRole(user, ['superadmin'])) {
          const found = await req.payload.find({
            collection: 'products',
            where: { skuErp: { equals: sku } },
            limit: 1,
            depth: 0,
            overrideAccess: true,
            req,
          })
          if (!found.docs[0]) {
            throw new Error(`No existe producto con referencia ${sku}`)
          }
        }
        return data
      },
    ],
    afterChange: [
      async (args) => {
        await mirrorGroupOfferToSupabase(args)
        return args.doc
      },
      ...auditHooks.afterChange,
    ],
    afterDelete: [
      async (args) => {
        await removeGroupOfferFromSupabase(args)
        return args.doc
      },
      ...auditHooks.afterDelete,
    ],
  },
  fields: [
    {
      name: 'productSku',
      type: 'text',
      label: 'Referencia SKU',
      required: true,
    },
    {
      name: 'offerNetPrice',
      type: 'number',
      label: 'Precio oferta neto',
      required: true,
      min: 0,
      admin: { step: 0.01 },
    },
    {
      name: 'customerGroup',
      type: 'select',
      label: 'Grupo cliente',
      options: CUSTOMER_GROUP_OPTIONS,
    },
    {
      name: 'validFrom',
      type: 'date',
      label: 'Vigente desde',
      required: true,
      defaultValue: () => new Date().toISOString().slice(0, 10),
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'validTo',
      type: 'date',
      label: 'Vigente hasta',
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Activa',
      defaultValue: true,
    },
    {
      name: 'supabaseId',
      type: 'text',
      label: 'ID Supabase',
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
}
