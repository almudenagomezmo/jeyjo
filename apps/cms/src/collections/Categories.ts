import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

import {
  staffCreateAccess,
  staffDeleteAccess,
  staffReadAccess,
  staffUpdateAccess,
} from '@/access/staffAccess'
import { isCollectionHidden } from '@/access/staffRoles'
import { createAuditHooks } from '@/hooks/auditLogHooks'
import { categorySearchEventHooks } from '@/hooks/searchEventHooks'

const auditHooks = createAuditHooks({ collection: 'categories' })

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'Categoría',
    plural: 'Categorías',
  },
  access: {
    create: staffCreateAccess('categories'),
    delete: staffDeleteAccess('categories'),
    read: () => true,
    update: staffUpdateAccess('categories'),
  },
  admin: {
    useAsTitle: 'title',
    group: 'Catálogo',
    defaultColumns: ['title', 'parent', 'slug'],
    hidden: ({ user }) => isCollectionHidden(user, 'categories'),
  },
  hooks: {
    beforeChange: auditHooks.beforeChange,
    afterChange: [
      ...categorySearchEventHooks.afterChange,
      ...auditHooks.afterChange,
    ],
    afterDelete: [
      ...categorySearchEventHooks.afterDelete,
      ...auditHooks.afterDelete,
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
    {
      name: 'homeGlyph',
      type: 'select',
      label: 'Icono home (glyph)',
      admin: {
        description: 'Icono en la rejilla de categorías destacadas de la tienda.',
      },
      options: [
        { label: 'Bolígrafo', value: 'pen' },
        { label: 'Cuaderno', value: 'notebook' },
        { label: 'Papel', value: 'paper' },
        { label: 'Tóner', value: 'toner' },
        { label: 'Tinta', value: 'ink' },
        { label: 'Carpeta', value: 'folder' },
        { label: 'Archivador', value: 'binder' },
        { label: 'Grapadora', value: 'stapler' },
        { label: 'Calculadora', value: 'calc' },
        { label: 'Tijeras', value: 'scissors' },
        { label: 'Marcador', value: 'marker' },
        { label: 'Cinta', value: 'tape' },
        { label: 'Reciclaje', value: 'recycle' },
        { label: 'Papelera', value: 'bin' },
        { label: 'Pilas', value: 'battery' },
        { label: 'Impresora', value: 'printer' },
        { label: 'Caja', value: 'box' },
      ],
    },
    slugField({
      position: undefined,
    }),
  ],
}
