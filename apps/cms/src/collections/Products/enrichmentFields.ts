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
        'Imagen de catálogo (listados y ficha): URL externa del proveedor. La imagen propia tiene prioridad en el storefront. No se usa para Open Graph.',
    },
  },
  {
    name: 'ownImage',
    type: 'upload',
    relationTo: 'media',
    label: 'Imagen propia',
    admin: {
      description:
        'Imagen de catálogo (listados y galería PDP). Prioridad sobre URL de proveedor. Para redes sociales use meta.image en la pestaña SEO Preview.',
    },
  },
  {
    name: 'additionalImages',
    type: 'array',
    label: 'Imágenes adicionales (galería PDP)',
    maxRows: 8,
    fields: [
      {
        name: 'image',
        type: 'upload',
        relationTo: 'media',
        label: 'Imagen',
        required: true,
      },
    ],
    admin: {
      description:
        'Fotos extra visibles solo en la ficha de producto. La imagen principal sigue siendo «Imagen propia» (o URL de proveedor si no hay propia).',
    },
  },
  {
    name: 'facetColor',
    type: 'text',
    label: 'Color (faceta PLP)',
    admin: {
      description: 'Valor mostrado en filtros del listado de productos (RF-010).',
    },
  },
  {
    name: 'facetMaterial',
    type: 'text',
    label: 'Material (faceta PLP)',
    admin: {
      description: 'Tipo de material para filtros del listado (RF-010).',
    },
  },
  {
    name: 'ecoLabel',
    type: 'checkbox',
    label: 'ECO / Sostenible',
    defaultValue: false,
    admin: {
      description: 'Producto con etiqueta ecológica en PLP.',
    },
  },
  {
    name: 'attachments',
    type: 'array',
    label: 'Adjuntos descargables',
    fields: [
      {
        name: 'label',
        type: 'text',
        label: 'Etiqueta',
        required: true,
      },
      {
        name: 'file',
        type: 'upload',
        relationTo: 'media',
        label: 'Archivo',
        required: true,
      },
    ],
    admin: {
      description: 'Manuales y fichas técnicas visibles en la ficha de producto (RF-012).',
    },
  },
]
