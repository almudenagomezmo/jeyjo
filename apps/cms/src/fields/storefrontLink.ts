import type { Field, GroupField } from 'payload'

import { deepMerge } from '@/utilities/deepMerge'

type StorefrontLinkType = (options?: { overrides?: Partial<GroupField> }) => Field

export const storefrontLink: StorefrontLinkType = ({ overrides = {} } = {}) => {
  const linkGroup: GroupField = {
    name: 'destination',
    type: 'group',
    label: 'Enlace destino',
    fields: [
      {
        name: 'type',
        type: 'radio',
        label: 'Tipo de enlace',
        defaultValue: 'reference',
        options: [
          { label: 'Categoría o producto', value: 'reference' },
          { label: 'URL personalizada', value: 'custom' },
        ],
        admin: { layout: 'horizontal' },
      },
      {
        name: 'reference',
        type: 'relationship',
        label: 'Destino del catálogo',
        relationTo: ['categories', 'products'],
        maxDepth: 1,
        admin: {
          condition: (_, siblingData) => siblingData?.type !== 'custom',
          description: 'Selecciona una categoría o un producto publicado en la tienda.',
        },
      },
      {
        name: 'url',
        type: 'text',
        label: 'URL personalizada',
        admin: {
          condition: (_, siblingData) => siblingData?.type === 'custom',
          description: 'Ruta interna (p. ej. /search?q=eco) o enlace externo (https://…).',
          placeholder: '/c/escritura o https://…',
        },
      },
    ],
  }

  return deepMerge(linkGroup, overrides)
}
