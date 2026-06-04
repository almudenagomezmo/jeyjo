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
    label: 'SKU ERP',
    access: erpReadOnlyFieldAccess,
    admin: { readOnly: true },
  },
  {
    name: 'mainWholesaleRef',
    type: 'text',
    label: 'Referencia mayorista principal',
    access: erpReadOnlyFieldAccess,
    admin: { readOnly: true },
  },
  {
    name: 'oemRef',
    type: 'text',
    label: 'Referencia OEM',
    access: erpReadOnlyFieldAccess,
    admin: { readOnly: true },
  },
  {
    name: 'ean',
    type: 'text',
    label: 'EAN',
    access: erpReadOnlyFieldAccess,
    admin: { readOnly: true },
  },
  {
    name: 'shortDescription',
    type: 'textarea',
    label: 'Descripción corta (ERP)',
    access: erpReadOnlyFieldAccess,
    admin: { readOnly: true },
  },
  {
    type: 'row',
    fields: [
      {
        name: 'p1Price',
        type: 'number',
        label: 'Precio P1',
        access: erpReadOnlyFieldAccess,
        admin: { readOnly: true, step: 0.01 },
      },
      {
        name: 'p2Price',
        type: 'number',
        label: 'Precio P2',
        access: erpReadOnlyFieldAccess,
        admin: { readOnly: true, step: 0.01 },
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
        admin: { readOnly: true, step: 0.01 },
      },
      {
        name: 'packUnit',
        type: 'number',
        label: 'Unidad de envase',
        access: erpReadOnlyFieldAccess,
        admin: { readOnly: true },
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
        admin: { readOnly: true },
      },
      {
        name: 'allowOrderWithoutStock',
        type: 'checkbox',
        label: 'Permite pedido sin stock',
        access: erpReadOnlyFieldAccess,
        admin: { readOnly: true },
      },
    ],
  },
  {
    name: 'erpStock',
    type: 'number',
    label: 'Stock ERP (stub)',
    access: erpReadOnlyFieldAccess,
    admin: {
      readOnly: true,
      description: 'Stock multisource en cambio #8; valor ERP de referencia',
    },
  },
  {
    name: 'syncErpAt',
    type: 'date',
    label: 'Última sync ERP',
    access: erpReadOnlyFieldAccess,
    admin: {
      readOnly: true,
      date: { pickerAppearance: 'dayAndTime' },
    },
  },
]
