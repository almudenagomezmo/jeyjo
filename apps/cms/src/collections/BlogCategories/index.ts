import { slugField } from 'payload'
import type { CollectionBeforeDeleteHook, CollectionConfig } from 'payload'

import {
  staffCreateAccess,
  staffDeleteAccess,
  staffReadAccess,
  staffUpdateAccess,
} from '@/access/staffAccess'
import { isCollectionHidden } from '@/access/staffRoles'
import { createAuditHooks } from '@/hooks/auditLogHooks'

const auditHooks = createAuditHooks({ collection: 'blog-categories' })

const blockDeleteWhenPostsExist: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const posts = await req.payload.find({
    collection: 'blog-posts',
    where: { category: { equals: id } },
    limit: 1,
    depth: 0,
    req,
  })

  if (posts.docs.length > 0) {
    throw new Error(
      'No se puede eliminar la categoría: hay artículos del blog que la usan. Reasígnalos antes de borrar.',
    )
  }
}

export const BlogCategories: CollectionConfig = {
  slug: 'blog-categories',
  labels: {
    singular: 'Categoría del blog',
    plural: 'Categorías del blog',
  },
  access: {
    create: staffCreateAccess('blog-categories'),
    delete: staffDeleteAccess('blog-categories'),
    read: staffReadAccess('blog-categories'),
    update: staffUpdateAccess('blog-categories'),
  },
  admin: {
    useAsTitle: 'name',
    group: 'Blog',
    defaultColumns: ['name', 'slug'],
    hidden: ({ user }) => isCollectionHidden(user, 'blog-categories'),
  },
  hooks: {
    beforeChange: auditHooks.beforeChange,
    beforeDelete: [blockDeleteWhenPostsExist],
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
    slugField({ fieldToUse: 'name' }),
    {
      name: 'description',
      type: 'textarea',
      label: 'Descripción',
    },
  ],
}
