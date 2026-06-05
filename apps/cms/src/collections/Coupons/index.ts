import type { CollectionConfig } from 'payload'

import {
  staffCreateAccess,
  staffDeleteAccess,
  staffReadAccess,
  staffUpdateAccess,
} from '@/access/staffAccess'
import { isCollectionHidden } from '@/access/staffRoles'

function normalizeCouponCode(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const code = value.trim().toUpperCase()
  return code || undefined
}

function isCouponExpired(validUntil: string | Date | null | undefined): boolean {
  if (!validUntil) return false
  const end = new Date(validUntil)
  end.setHours(23, 59, 59, 999)
  return end.getTime() < Date.now()
}

export const Coupons: CollectionConfig = {
  slug: 'coupons',
  labels: {
    singular: 'Cupón',
    plural: 'Cupones',
  },
  access: {
    create: staffCreateAccess('coupons'),
    read: () => true,
    update: staffUpdateAccess('coupons'),
    delete: staffDeleteAccess('coupons'),
  },
  admin: {
    group: 'Marketing',
    useAsTitle: 'code',
    defaultColumns: [
      'code',
      'discountType',
      'discountValue',
      'active',
      'validUntil',
      'usesCount',
      'source',
    ],
    hidden: ({ user }) => isCollectionHidden(user, 'coupons'),
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data || typeof data !== 'object') return data
        const next = { ...data }
        if ('code' in next) {
          next.code = normalizeCouponCode(next.code)
        }
        return next
      },
    ],
    beforeChange: [
      ({ data }) => {
        if (!data || typeof data !== 'object') return data
        const next = { ...data }
        if ('validUntil' in next && isCouponExpired(next.validUntil as string)) {
          next.active = false
        }
        if (next.discountType === 'percent' && typeof next.discountValue === 'number') {
          next.discountValue = Math.min(100, Math.max(0, next.discountValue))
        }
        return next
      },
    ],
    afterRead: [
      ({ doc }) => {
        if (!doc) return doc
        if (isCouponExpired(doc.validUntil as string | undefined)) {
          return { ...doc, active: false }
        }
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      label: 'Código',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Se guarda en mayúsculas (ej. BLOG5)',
      },
    },
    {
      name: 'discountType',
      type: 'select',
      label: 'Tipo de descuento',
      required: true,
      defaultValue: 'percent',
      options: [
        { label: 'Porcentaje', value: 'percent' },
        { label: 'Importe fijo', value: 'fixed' },
      ],
    },
    {
      name: 'discountValue',
      type: 'number',
      label: 'Valor',
      required: true,
      min: 0,
      admin: {
        description: 'Porcentaje 1–100 o importe fijo en € (neto)',
      },
    },
    {
      name: 'minimumOrderAmount',
      type: 'number',
      label: 'Importe mínimo de pedido',
      defaultValue: 0,
      min: 0,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'validFrom',
          type: 'date',
          label: 'Válido desde',
          required: true,
        },
        {
          name: 'validUntil',
          type: 'date',
          label: 'Válido hasta',
          required: true,
        },
      ],
    },
    {
      name: 'maxUses',
      type: 'number',
      label: 'Usos máximos',
      min: 1,
      admin: {
        description: 'Vacío = ilimitado',
      },
    },
    {
      name: 'usesCount',
      type: 'number',
      label: 'Usos registrados',
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Activo',
      defaultValue: true,
    },
    {
      name: 'source',
      type: 'select',
      label: 'Origen',
      defaultValue: 'manual',
      options: [
        { label: 'Manual', value: 'manual' },
        { label: 'Recuperación carrito', value: 'recovery' },
      ],
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'recoveryCartId',
      type: 'text',
      label: 'ID snapshot carrito',
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'recovery',
        readOnly: true,
      },
    },
  ],
}
