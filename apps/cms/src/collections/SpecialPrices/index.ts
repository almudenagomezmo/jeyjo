import type { CollectionConfig } from 'payload'

import {
  staffCreateAccess,
  staffDeleteAccess,
  staffReadAccess,
  staffUpdateAccess,
} from '@/access/staffAccess'
import { isCollectionHidden, hasStaffRole } from '@/access/staffRoles'
import { createAuditHooks } from '@/hooks/auditLogHooks'
import {
  mirrorSpecialPriceToSupabase,
  removeSpecialPriceFromSupabase,
} from '@/collections/SpecialPrices/supabase-mirror'

const auditHooks = createAuditHooks({ collection: 'special-prices' })

export const SpecialPrices: CollectionConfig = {
  slug: 'special-prices',
  /** Avoid collision with Supabase `public.special_prices` (UUID pricing table). */
  dbName: 'cms_special_prices',
  labels: {
    singular: 'Precio especial',
    plural: 'Precios especiales',
  },
  access: {
    create: staffCreateAccess('special-prices'),
    read: staffReadAccess('special-prices'),
    update: staffUpdateAccess('special-prices'),
    delete: staffDeleteAccess('special-prices'),
  },
  admin: {
    group: 'Clientes B2B',
    useAsTitle: 'productSku',
    defaultColumns: ['customerId', 'productSku', 'netPrice', 'validTo'],
    hidden: ({ user }) => isCollectionHidden(user, 'special-prices'),
  },
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        if (!data || typeof data !== 'object') return data
        const sku = String(data.productSku ?? '').trim()
        if (!sku) throw new Error('productSku es obligatorio')

        const user = req.user
        const isSuperadmin = hasStaffRole(user, ['superadmin'])
        if (!isSuperadmin) {
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
        await mirrorSpecialPriceToSupabase(args)
        return args.doc
      },
      ...auditHooks.afterChange,
    ],
    afterDelete: [
      async (args) => {
        await removeSpecialPriceFromSupabase(args)
        return args.doc
      },
      ...auditHooks.afterDelete,
    ],
  },
  fields: [
    {
      name: 'customerId',
      type: 'text',
      label: 'ID cliente (UUID)',
      required: true,
      index: true,
    },
    {
      name: 'productSku',
      type: 'text',
      label: 'Referencia SKU',
      required: true,
    },
    {
      name: 'netPrice',
      type: 'number',
      label: 'Precio neto pactado',
      required: true,
      min: 0,
      admin: { step: 0.01 },
    },
    {
      name: 'discount1Pct',
      type: 'number',
      label: 'Descuento 1 (%)',
      admin: { step: 0.01 },
    },
    {
      name: 'discount2Pct',
      type: 'number',
      label: 'Descuento 2 (%)',
      admin: { step: 0.01 },
    },
    {
      name: 'minQty',
      type: 'number',
      label: 'Cantidad mínima',
      min: 0,
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
      name: 'supabaseId',
      type: 'text',
      label: 'ID Supabase',
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
}
