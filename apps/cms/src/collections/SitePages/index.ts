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

const auditHooks = createAuditHooks({ collection: 'site-pages' })

export const SitePages: CollectionConfig = {
  slug: 'site-pages',
  labels: {
    singular: 'Página del sitio',
    plural: 'Páginas del sitio',
  },
  access: {
    create: staffCreateAccess('site-pages'),
    delete: staffDeleteAccess('site-pages'),
    read: staffReadAccess('site-pages'),
    update: staffUpdateAccess('site-pages'),
  },
  admin: {
    useAsTitle: 'title',
    group: 'Contenido',
    defaultColumns: ['title', 'slug', 'pageType', 'published'],
    hidden: ({ user }) => isCollectionHidden(user, 'site-pages'),
  },
  hooks: {
    beforeChange: auditHooks.beforeChange,
    afterChange: auditHooks.afterChange,
    afterDelete: auditHooks.afterDelete,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Título',
      required: true,
    },
    slugField({ fieldToUse: 'title' }),
    {
      name: 'pageType',
      type: 'select',
      label: 'Tipo',
      required: true,
      defaultValue: 'legal',
      options: [
        { label: 'Legal', value: 'legal' },
        { label: 'FAQ', value: 'faq' },
        { label: 'Ayuda', value: 'help' },
      ],
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Contenido',
      required: true,
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      label: 'Meta description (SEO)',
    },
    {
      name: 'published',
      type: 'checkbox',
      label: 'Publicada',
      defaultValue: false,
    },
  ],
}
