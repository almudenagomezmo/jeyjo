import type { CollectionConfig } from 'payload'

import {
  staffCreateAccess,
  staffDeleteAccess,
  staffUpdateAccess,
} from '@/access/staffAccess'
import { erpReadOnlyFieldAccess } from '@/access/erpReadOnlyFieldAccess'
import { isCollectionHidden } from '@/access/staffRoles'
import { erpSupplierBeforeChange } from '@/collections/Suppliers/erpHooks'
import { createAuditHooks } from '@/hooks/auditLogHooks'

const auditHooks = createAuditHooks({ collection: 'suppliers' })

export const Suppliers: CollectionConfig = {
  slug: 'suppliers',
  labels: {
    singular: 'Proveedor',
    plural: 'Proveedores',
  },
  access: {
    create: staffCreateAccess('suppliers'),
    delete: staffDeleteAccess('suppliers'),
    // Public read so storefront PLP/PDP can resolve supplier names via depth=1 (same as categories).
    read: () => true,
    update: staffUpdateAccess('suppliers'),
  },
  admin: {
    useAsTitle: 'name',
    group: 'Catálogo',
    defaultColumns: ['name', 'erpCode', 'type'],
    hidden: ({ user }) => isCollectionHidden(user, 'suppliers'),
  },
  hooks: {
    beforeChange: [...auditHooks.beforeChange, erpSupplierBeforeChange],
    afterChange: auditHooks.afterChange,
    afterDelete: auditHooks.afterDelete,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Nombre',
      required: true,
      access: erpReadOnlyFieldAccess,
      admin: { readOnly: false },
    },
    {
      name: 'erpCode',
      type: 'text',
      label: 'Código proveedor',
      index: true,
      access: erpReadOnlyFieldAccess,
      admin: { readOnly: false },
    },
    {
      name: 'type',
      type: 'select',
      label: 'Tipo',
      access: erpReadOnlyFieldAccess,
      admin: { readOnly: false },
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
      access: erpReadOnlyFieldAccess,
      admin: {
        readOnly: false,
        description: 'Prefijo URL para imágenes del proveedor',
      },
    },
  ],
}
