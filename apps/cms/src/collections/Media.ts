import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import {
  staffCreateAccess,
  staffDeleteAccess,
  staffUpdateAccess,
} from '@/access/staffAccess'
import { isCollectionHidden } from '@/access/staffRoles'
import { createAuditHooks } from '@/hooks/auditLogHooks'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const auditHooks = createAuditHooks({ collection: 'media' })

export const Media: CollectionConfig = {
  admin: {
    group: 'Contenido',
    hidden: ({ user }) => isCollectionHidden(user, 'media'),
  },
  slug: 'media',
  access: {
    create: staffCreateAccess('media'),
    delete: staffDeleteAccess('media'),
    read: () => true,
    update: staffUpdateAccess('media'),
  },
  hooks: {
    beforeChange: auditHooks.beforeChange,
    afterChange: auditHooks.afterChange,
    afterDelete: auditHooks.afterDelete,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
  ],
  upload: {
    staticDir: path.resolve(dirname, '../../public/media'),
  },
}
