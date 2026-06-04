import type { Field } from 'payload'

import { erpReadOnlyFieldAccess } from '@/access/erpReadOnlyFieldAccess'

export const stockFields: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'distrisantiagoStock',
        type: 'number',
        label: 'Stock Distrisantiago (interno)',
        access: erpReadOnlyFieldAccess,
        admin: { readOnly: true },
      },
      {
        name: 'arnoiaStock',
        type: 'number',
        label: 'Stock Arnoia (interno)',
        access: erpReadOnlyFieldAccess,
        admin: { readOnly: true },
      },
    ],
  },
  {
    name: 'stockIndicator',
    type: 'select',
    label: 'Indicador semáforo (RF-005)',
    access: erpReadOnlyFieldAccess,
    admin: { readOnly: true },
    options: [
      { label: 'Disponible', value: 'available' },
      { label: 'Últimas unidades', value: 'low' },
      { label: 'Disponibilidad limitada', value: 'limited' },
    ],
  },
  {
    type: 'row',
    fields: [
      {
        name: 'syncDistrisantiagoAt',
        type: 'date',
        label: 'Última sync Distrisantiago',
        access: erpReadOnlyFieldAccess,
        admin: {
          readOnly: true,
          date: { pickerAppearance: 'dayAndTime' },
        },
      },
      {
        name: 'syncArnoiaAt',
        type: 'date',
        label: 'Última sync Arnoia',
        access: erpReadOnlyFieldAccess,
        admin: {
          readOnly: true,
          date: { pickerAppearance: 'dayAndTime' },
        },
      },
    ],
  },
]
