import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import {
  staffCreateAccess,
  staffDeleteAccess,
  staffReadAccess,
  staffUpdateAccess,
} from '@/access/staffAccess'
import { isCollectionHidden } from '@/access/staffRoles'
import { createAuditHooks } from '@/hooks/auditLogHooks'
import { normalizeBlogPostTags, validateBlogPostPublishRules } from '@/hooks/blogPostHooks'

const auditHooks = createAuditHooks({ collection: 'blog-posts', deferWrites: true })

export const BlogPosts: CollectionConfig = {
  slug: 'blog-posts',
  labels: {
    singular: 'Artículo del blog',
    plural: 'Artículos del blog',
  },
  access: {
    create: staffCreateAccess('blog-posts'),
    delete: staffDeleteAccess('blog-posts'),
    read: staffReadAccess('blog-posts'),
    update: staffUpdateAccess('blog-posts'),
  },
  admin: {
    useAsTitle: 'title',
    group: 'Blog',
    defaultColumns: ['title', 'category', 'published', 'publishedAt'],
    hidden: ({ user }) => isCollectionHidden(user, 'blog-posts'),
  },
  hooks: {
    beforeValidate: [normalizeBlogPostTags, validateBlogPostPublishRules],
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
      name: 'category',
      type: 'relationship',
      relationTo: 'blog-categories',
      label: 'Categoría',
      required: true,
    },
    {
      name: 'tags',
      type: 'array',
      label: 'Etiquetas',
      labels: { singular: 'Etiqueta', plural: 'Etiquetas' },
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Imagen destacada',
      filterOptions: {
        mimeType: { contains: 'image' },
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      label: 'Extracto',
      maxLength: 320,
      admin: {
        description: 'Opcional. Si está vacío, el listado usa un resumen del contenido.',
      },
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Contenido',
      required: true,
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
    },
    {
      name: 'authorName',
      type: 'text',
      label: 'Autor',
      required: true,
      defaultValue: 'Equipo Jeyjo',
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      label: 'Meta description (SEO)',
    },
    {
      name: 'published',
      type: 'checkbox',
      label: 'Publicado',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Fecha de publicación',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Permite programar publicación futura.',
      },
    },
  ],
}
