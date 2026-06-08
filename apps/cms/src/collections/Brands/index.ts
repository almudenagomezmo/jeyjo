import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

import {
  staffCreateAccess,
  staffDeleteAccess,
  staffUpdateAccess,
} from '@/access/staffAccess'
import { isCollectionHidden } from '@/access/staffRoles'
import { createAuditHooks } from '@/hooks/auditLogHooks'

const auditHooks = createAuditHooks({ collection: 'brands' })

export const Brands: CollectionConfig = {
  slug: 'brands',
  labels: {
    singular: 'Marca',
    plural: 'Marcas',
  },
  access: {
    create: staffCreateAccess('brands'),
    delete: staffDeleteAccess('brands'),
    // Public read so storefront PLP/PDP can resolve brand names via depth=1 (same as categories).
    read: () => true,
    update: staffUpdateAccess('brands'),
  },
  admin: {
    useAsTitle: 'name',
    group: 'Catálogo',
    defaultColumns: ['name', 'slug'],
    hidden: ({ user }) => isCollectionHidden(user, 'brands'),
  },
  hooks: {
    beforeChange: auditHooks.beforeChange,
    afterChange: auditHooks.afterChange,
    afterDelete: auditHooks.afterDelete,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Nombre',
      required: true,
    },
    slugField({ useAsSlug: 'name' }),
  ],
}
