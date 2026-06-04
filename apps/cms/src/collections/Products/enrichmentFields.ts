import type { Field } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const enrichmentFields: Field[] = [
  {
    name: 'longDescription',
    type: 'richText',
    label: 'Descripción larga (marketing)',
    editor: lexicalEditor({
      features: ({ rootFeatures }) => [
        ...rootFeatures,
        HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
        FixedToolbarFeature(),
        InlineToolbarFeature(),
        HorizontalRuleFeature(),
      ],
    }),
  },
  {
    name: 'metaDescription',
    type: 'textarea',
    label: 'Metadescripción',
    maxLength: 160,
    admin: {
      description: 'Máximo 160 caracteres para SEO',
    },
  },
  {
    name: 'keywords',
    type: 'array',
    label: 'Palabras clave',
    fields: [
      {
        name: 'keyword',
        type: 'text',
        required: true,
      },
    ],
  },
  {
    name: 'providerImageUrl',
    type: 'text',
    label: 'URL imagen proveedor',
    admin: {
      description:
        'URL externa del proveedor (sin descarga). Si hay imagen propia, tiene prioridad en el frontend.',
    },
  },
  {
    name: 'ownImage',
    type: 'upload',
    relationTo: 'media',
    label: 'Imagen propia',
    admin: {
      description: 'Subida a catalog-media. Prioridad sobre URL de proveedor.',
    },
  },
]
