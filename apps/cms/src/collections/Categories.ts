import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { auditLogHooksForCollection } from '@/hooks/auditLogHooks'
import { categorySearchEventHooks } from '@/hooks/searchEventHooks'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'Categoría',
    plural: 'Categorías',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    useAsTitle: 'title',
    group: 'Catálogo',
    defaultColumns: ['title', 'parent', 'slug'],
  },
  hooks: {
    afterChange: [
      ...categorySearchEventHooks.afterChange,
      ...auditLogHooksForCollection('categories').afterChange,
    ],
    afterDelete: [
      ...categorySearchEventHooks.afterDelete,
      ...auditLogHooksForCollection('categories').afterDelete,
    ],
    beforeValidate: [
      async ({ data, operation, req, originalDoc }) => {
        if (!data?.slug) return data

        const existing = await req.payload.find({
          collection: 'categories',
          where: {
            slug: { equals: data.slug },
            ...(operation === 'update' && originalDoc?.id
              ? { id: { not_equals: originalDoc.id } }
              : {}),
          },
          limit: 1,
          depth: 0,
        })

        if (existing.docs.length > 0) {
          throw new Error(`El slug "${data.slug}" ya está en uso por otra categoría.`)
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Nombre',
      required: true,
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Categoría padre',
    },
    {
      name: 'sortOrder',
      type: 'number',
      label: 'Orden',
      defaultValue: 0,
    },
    {
      name: 'imageUrl',
      type: 'text',
      label: 'URL de imagen',
    },
    slugField({
      position: undefined,
    }),
  ],
}
