import type { GlobalConfig } from 'payload'

import { marketingStaffUpdate } from '@/access/marketingStaff'

export const MarketingSettings: GlobalConfig = {
  slug: 'marketingSettings',
  label: 'Carrito abandonado',
  admin: {
    group: 'Marketing',
  },
  access: {
    read: () => true,
    update: marketingStaffUpdate,
  },
  fields: [
    {
      name: 'abandonedCartEnabled',
      type: 'checkbox',
      label: 'Recuperación de carrito activa',
      defaultValue: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'firstEmailDelayMinutes',
          type: 'number',
          label: 'Primer email (minutos)',
          defaultValue: 120,
          min: 1,
          admin: {
            description: 'Por defecto 2 horas',
          },
        },
        {
          name: 'secondEmailDelayMinutes',
          type: 'number',
          label: 'Segundo email (minutos)',
          defaultValue: 1440,
          min: 1,
          admin: {
            description: 'Por defecto 24 horas',
          },
        },
      ],
    },
    {
      name: 'secondEmailDiscountPercent',
      type: 'number',
      label: 'Descuento segundo email (%)',
      defaultValue: 10,
      min: 0,
      max: 100,
    },
    {
      name: 'secondEmailUseFixedCoupon',
      type: 'relationship',
      relationTo: 'coupons',
      label: 'Cupón fijo para segundo email (opcional)',
      admin: {
        description: 'Si está vacío, se genera un cupón RECOVER- único de un solo uso',
      },
    },
    {
      name: 'b2bRecoveryEnabled',
      type: 'checkbox',
      label: 'Recuperación B2B activa',
      defaultValue: false,
    },
    {
      name: 'b2bRecoveryCustomerGroups',
      type: 'array',
      label: 'Grupos B2B con recuperación',
      admin: {
        condition: (_, siblingData) => siblingData?.b2bRecoveryEnabled === true,
      },
      fields: [
        {
          name: 'code',
          type: 'text',
          label: 'Código grupo (número 2–4)',
          required: true,
        },
      ],
    },
  ],
}
