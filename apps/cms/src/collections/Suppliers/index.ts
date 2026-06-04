import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { auditLogHooksForCollection } from '@/hooks/auditLogHooks'

export const Suppliers: CollectionConfig = {
  slug: 'suppliers',
  labels: {
    singular: 'Proveedor',
    plural: 'Proveedores',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  admin: {
    useAsTitle: 'name',
    group: 'Catálogo',
    defaultColumns: ['name', 'erpCode', 'type'],
  },
  hooks: auditLogHooksForCollection('suppliers'),
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Nombre',
      required: true,
    },
    {
      name: 'erpCode',
      type: 'text',
      label: 'Código ERP',
      index: true,
    },
    {
      name: 'type',
      type: 'select',
      label: 'Tipo',
      options: [
        { label: 'Mayorista', value: 'wholesaler' },
        { label: 'Fabricante', value: 'manufacturer' },
        { label: 'Distribuidor', value: 'distributor' },
        { label: 'Otro', value: 'other' },
      ],
    },
    {
      name: 'baseImageUrl',
      type: 'text',
      label: 'URL base de imágenes',
      admin: {
        description: 'Prefijo URL para imágenes del proveedor (ej. Distrisantiago, Arnoia)',
      },
    },
  ],
}
