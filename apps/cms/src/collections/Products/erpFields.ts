import type { Field } from 'payload'

import { erpReadOnlyFieldAccess } from '@/access/erpReadOnlyFieldAccess'

/**
 * ERP-sourced product fields. Dual protection:
 * - Admin UI: `erpReadOnlyFieldAccess` (update denied for staff)
 * - Server: `erpProductBeforeChange` strips ERP fields unless `req.context.erpSync === true`
 * DTO shape: `@jeyjo/erp-ports` `ErpProductDto` via `mapErpProductDtoToPayload`.
 */

export const erpFields: Field[] = [
  {
    name: 'skuErp',
    type: 'text',
    label: 'Referencia / SKU',
    access: erpReadOnlyFieldAccess,
    admin: { readOnly: false },
  },
  {
    name: 'mainWholesaleRef',
    type: 'text',
    label: 'Referencia mayorista principal',
    access: erpReadOnlyFieldAccess,
    admin: { readOnly: false },
  },
  {
    name: 'oemRef',
    type: 'text',
    label: 'Referencia OEM',
    access: erpReadOnlyFieldAccess,
    admin: { readOnly: false },
  },
  {
    name: 'ean',
    type: 'text',
    label: 'EAN',
    access: erpReadOnlyFieldAccess,
    admin: { readOnly: false },
  },
  {
    name: 'shortDescription',
    type: 'textarea',
    label: 'Descripción corta (ERP)',
    access: erpReadOnlyFieldAccess,
    admin: { readOnly: false },
  },
  {
    type: 'row',
    fields: [
      {
        name: 'p1Price',
        type: 'number',
        label: 'Precio P1',
        access: erpReadOnlyFieldAccess,
        admin: { readOnly: false, step: 0.01 },
      },
      {
        name: 'p2Price',
        type: 'number',
        label: 'Precio P2',
        access: erpReadOnlyFieldAccess,
        admin: { readOnly: false, step: 0.01 },
      },
    ],
  },
  {
    type: 'row',
    fields: [
      {
        name: 'vatRate',
        type: 'number',
        label: 'IVA actual (%)',
        access: erpReadOnlyFieldAccess,
        admin: { readOnly: false, step: 0.01 },
      },
      {
        name: 'packUnit',
        type: 'number',
        label: 'Unidad de envase',
        access: erpReadOnlyFieldAccess,
        admin: { readOnly: false },
      },
    ],
  },
  {
    type: 'row',
    fields: [
      {
        name: 'isWildcard',
        type: 'checkbox',
        label: 'Es comodín',
        access: erpReadOnlyFieldAccess,
        admin: { readOnly: false },
      },
      {
        name: 'allowOrderWithoutStock',
        type: 'checkbox',
        label: 'Permite pedido sin stock',
        access: erpReadOnlyFieldAccess,
        admin: { readOnly: false },
      },
    ],
  },
  {
    name: 'erpStock',
    type: 'number',
    label: 'Stock disponible',
    access: erpReadOnlyFieldAccess,
    admin: {
      readOnly: false,
      description: 'Unidades disponibles para venta (gestión manual en modo web-native).',
    },
    min: 0,
  },
  {
    name: 'stockIndicator',
    type: 'select',
    label: 'Indicador semáforo',
    access: { update: () => false },
    admin: {
      readOnly: true,
      description: 'Calculado automáticamente al guardar según stock disponible y umbral configurado.',
    },
    options: [
      { label: 'Disponible', value: 'available' },
      { label: 'Últimas unidades', value: 'low' },
      { label: 'Disponibilidad limitada', value: 'limited' },
    ],
  },
  {
    name: 'syncErpAt',
    type: 'date',
    label: 'Última sync ERP',
    access: erpReadOnlyFieldAccess,
    admin: {
      readOnly: true,
      date: { pickerAppearance: 'dayAndTime' },
      description: 'Solo actualizado por sync ERP cuando el modo web-native está desactivado.',
    },
  },
]
